import { Footer, Header, StructureGallery } from "../components";

const structureImages = [
  { src: "/assets/fachada-2.webp", alt: "Fachada da nova unidade da Alpha Imagem e Diagnóstico na Praia do Canto", caption: "Unidade na Praia do Canto" },
  { src: "/assets/recepcao-clinica.jpg", alt: "Recepção da Alpha Imagem e Diagnóstico", caption: "Recepção pensada para acolher" },
  { src: "/assets/rampa.webp", alt: "Rampa de acessibilidade na entrada da Alpha para pessoas com deficiência ou mobilidade reduzida", caption: "Acesso com conforto e autonomia" },
  { src: "/assets/corredor-2.webp", alt: "Corredor interno da Alpha Imagem e Diagnóstico", caption: "Circulação interna da clínica" },
  { src: "/assets/corredor-1.webp", alt: "Detalhe arquitetônico de ambiente interno da Alpha", caption: "Detalhes que tornam o cuidado mais acolhedor" },
  { src: "/assets/fachada-clinica.jpg", alt: "Entrada principal da Alpha Imagem e Diagnóstico", caption: "Identidade e localização estratégica" },
  { src: "/assets/estacionamento.webp", alt: "Área de acesso e estacionamento em frente à Alpha Imagem e Diagnóstico", caption: "Chegada facilitada à clínica" },
];

export default function EquipeEstrutura() {
  return <>
    <Header solid />
    <main className="team-page alpha-story-page">
      <section className="alpha-story-intro" aria-label="História da Alpha">
        <div className="team-page-hero alpha-story-hero">
          <div className="container">
            <p className="eyebrow">Alpha Imagem e Diagnóstico</p>
            <h1>Uma história construída com precisão.<br /><em>Um cuidado que evolui.</em></h1>
            <p>Conheça a trajetória, a equipe e a estrutura que fazem da Alpha um espaço dedicado ao diagnóstico por imagem com tecnologia, experiência e atenção genuína ao paciente.</p>
          </div>
        </div>
        <div className="section alpha-history" aria-labelledby="history-title">
          <div className="container history-editorial" data-reveal>
            <div className="history-copy">
              <p className="eyebrow">Nossa trajetória</p>
              <h2 id="history-title">Desde 2018,<br /><em>precisão que cuida.</em></h2>
              <div className="history-text">
                <p>Fundada em Vitória, a Alpha Imagem e Diagnóstico nasceu da união de profissionais da área médica com o propósito de oferecer diagnóstico por imagem aliado à experiência, tecnologia e cuidado com o paciente.</p>
                <p>Ao longo dos anos, a clínica ampliou sua equipe, incorporou novos profissionais e evoluiu sua estrutura. Em 2024, iniciou um novo capítulo de sua história com a mudança para uma nova unidade na Praia do Canto, projetada para oferecer ainda mais conforto e qualidade na realização dos exames.</p>
                <p>Hoje, a Alpha reúne profissionais especializados e tecnologia para a realização de ultrassonografia, mamografia e procedimentos guiados por imagem, mantendo o atendimento próximo e cuidadoso como parte essencial da experiência de cada paciente.</p>
              </div>
            </div>
            <div className="history-gallery" aria-label="Ambientes e acessos da Alpha">
              <StructureGallery images={structureImages} />
            </div>
          </div>
        </div>
      </section>

      <section className="section structure-story" id="estrutura" aria-labelledby="structure-title">
        <div className="container">
          <div className="structure-editorial-heading" data-reveal>
            <div>
              <p className="eyebrow light">Estrutura & tecnologia</p>
              <h2 id="structure-title">Um espaço preparado<br /><em>para cuidar de você.</em></h2>
              <a className="button button-light structure-appointment" href="https://wa.me/552730606900" target="_blank" rel="noopener noreferrer">Agendar exame <span>↗</span></a>
            </div>
            <div className="structure-editorial-copy">
              <p>Ambientes acolhedores, acesso facilitado e tecnologia reunidos em uma localização estratégica. Cada espaço foi pensado para favorecer a qualidade dos exames e tornar a experiência mais tranquila.</p>
              <p>A organização da clínica integra recepção, circulação, salas de exames e recursos de diagnóstico por imagem com conforto, privacidade e atenção aos detalhes.</p>
              <div className="accessibility-note">
                <span>Acessibilidade como parte do cuidado</span>
                <p>A entrada com rampa facilita o acesso de pessoas com deficiência ou mobilidade reduzida, promovendo mais autonomia e conforto desde a chegada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
    <Footer />
  </>;
}
