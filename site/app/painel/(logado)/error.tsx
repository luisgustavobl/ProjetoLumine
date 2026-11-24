"use client";

// Página de erro do painel: aparece se uma consulta ao banco falhar, sem derrubar o painel inteiro.
export default function ErroPainel({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="p-bloco">
      <h1>Algo deu errado</h1>
      <p className="nota">Não foi possível carregar esta página. Verifique a internet e tente de novo.</p>
      <p className="erro">{error.message}</p>
      <button className="botao" type="button" onClick={reset}>Tentar de novo</button>
    </section>
  );
}
