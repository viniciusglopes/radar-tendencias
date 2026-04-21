export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Politica de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-8">Ultima atualizacao: 21 de abril de 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Introducao</h2>
            <p>O Radar de Tendencias ("nos") respeita a privacidade dos usuarios. Esta politica descreve como coletamos, usamos e protegemos informacoes ao utilizar nossa plataforma de inteligencia de mercado.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Dados coletados</h2>
            <p>Coletamos apenas dados publicamente disponiveis de fontes abertas como Google Trends, YouTube Data API e Meta Ad Library API. Nao coletamos dados pessoais de usuarios finais.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Uso dos dados</h2>
            <p>Os dados coletados sao utilizados exclusivamente para analise de tendencias de mercado, identificacao de produtos em alta e geracao de relatorios de inteligencia competitiva.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. APIs de terceiros</h2>
            <p>Utilizamos APIs publicas do Google, YouTube, Mercado Livre e Meta. O uso dessas APIs esta em conformidade com os termos de servico de cada plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Armazenamento</h2>
            <p>Os dados sao armazenados em servidores seguros e sao retidos apenas pelo periodo necessario para a analise de tendencias.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Contato</h2>
            <p>Para duvidas sobre esta politica, entre em contato pelo email: viniciusglopes@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
