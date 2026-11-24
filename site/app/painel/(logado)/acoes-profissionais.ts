"use server";

import { revalidatePath } from "next/cache";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";
import { normalizarTelefone } from "@/lib/validacao";
import type { EstadoForm } from "../acoes-auth";
import { trocarImagem } from "./trocar-imagem";

const texto = (form: FormData, campo: string, max = 500) => String(form.get(campo) ?? "").trim().slice(0, max);
const lista = (bruto: string, separador: RegExp) => bruto.split(separador).map((x) => x.trim()).filter(Boolean);

/** Gera um id legível a partir do nome: "Ana Júlia" -> "ana-julia". */
const slug = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

/** Lê e valida os campos do perfil (mesmo formulário para editar e cadastrar). */
function lerPerfil(form: FormData) {
  const nome = texto(form, "nome", 80);
  if (nome.length < 2) return { erro: "O nome é obrigatório." } as const;
  const especialidade = texto(form, "especialidade", 60);
  if (!especialidade) return { erro: "A especialidade é obrigatória." } as const;

  const whatsappBruto = texto(form, "whatsapp", 20);
  const whatsapp = whatsappBruto ? normalizarTelefone(whatsappBruto) : null;
  if (whatsappBruto && !whatsapp) return { erro: "WhatsApp inválido. Use DDD + número, ex.: (85) 9 9999-9999." } as const;

  const instagram = texto(form, "instagram", 60).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  return {
    perfil: {
      nome,
      especialidade,
      sobre: texto(form, "sobre", 400),
      tags: lista(texto(form, "tags", 300), /,/).slice(0, 6),
      instagram: instagram || null,
      whatsapp,
      formacao: lista(texto(form, "formacao", 4000), /\n/),
      ativo: form.get("ativo") === "on",
    },
    servicos: form.getAll("servicos").map(String),
  } as const;
}

type Db = Awaited<ReturnType<typeof clienteSessao>>;

/** Substitui os serviços que a profissional atende pelos marcados no formulário. */
async function gravarServicos(db: Db, id: string, servicos: string[]) {
  const apagar = await db.from("servico_profissional").delete().eq("profissional_id", id);
  if (apagar.error) throw new Error(apagar.error.message);
  if (servicos.length) {
    const inserir = await db.from("servico_profissional").insert(servicos.map((s) => ({ servico_id: s, profissional_id: id })));
    if (inserir.error) throw new Error(inserir.error.message);
  }
}

/** Salva o perfil de uma profissional e os serviços que ela atende. */
export async function salvarProfissional(id: string, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirEquipe();
  const lido = lerPerfil(form);
  if ("erro" in lido) return { erro: lido.erro };

  try {
    const db = await clienteSessao();
    const { error } = await db.from("profissionais").update(lido.perfil).eq("id", id);
    if (error) throw new Error(error.message);
    await gravarServicos(db, id, lido.servicos);
  } catch (erro) {
    console.error("[painel/profissionais]", (erro as Error).message);
    return { erro: "Não foi possível salvar. Tente de novo." };
  }
  revalidatePath("/painel/profissionais");
  revalidatePath("/");
  return { ok: "Salvo! O site já mostra as mudanças." };
}

/** Cadastra uma nova profissional com o perfil completo. Só aparece no site se "Visível no site" for marcado. */
export async function criarProfissional(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirEquipe();
  const lido = lerPerfil(form);
  if ("erro" in lido) return { erro: lido.erro };

  try {
    const db = await clienteSessao();
    const { count } = await db.from("profissionais").select("id", { count: "exact", head: true });
    let id = slug(lido.perfil.nome) || "profissional";
    const existe = await db.from("profissionais").select("id").eq("id", id).maybeSingle();
    if (existe.data) id = `${id}-${Date.now().toString(36).slice(-4)}`;
    const { error } = await db.from("profissionais").insert({ id, ...lido.perfil, ordem: (count ?? 0) + 1 });
    if (error) throw new Error(error.message);
    await gravarServicos(db, id, lido.servicos);
  } catch (erro) {
    console.error("[painel/profissionais]", (erro as Error).message);
    return { erro: "Não foi possível cadastrar. Tente de novo." };
  }
  revalidatePath("/painel", "layout");
  revalidatePath("/");
  return { ok: "Profissional cadastrada. Adicione a foto de perfil no cartão dela." };
}

/** Grava a nova foto de perfil (o navegador já enviou o arquivo para perfis/<id>/). */
export async function trocarRetrato(id: string, caminho: string) {
  return trocarImagem({ tabela: "profissionais", coluna: "retrato_url", pasta: "perfis" }, id, caminho);
}
