import { Footer, Header } from "../components";
import { ArrowUpRight } from "lucide-react";
import { team } from "../team";

export default function EquipePage() {
  return <>
    <Header solid />
    <main className="medical-team-page">
      <section className="team-page-hero medical-team-hero">
        <div className="container">
          <p className="eyebrow">Equipe médica</p>
          <h1>Experiência que traz segurança.<br /><em>Cuidado que acolhe.</em></h1>
          <p>Conheça os profissionais que unem formação sólida, atualização constante e atenção genuína em cada etapa do diagnóstico.</p>
        </div>
      </section>

      <section className="section medical-team-list" aria-label="Profissionais da Alpha">
        <div className="container enriched-team-grid">
          {team.map((person, index) => <article className="enriched-doctor" key={person.name}>
            <div className="enriched-doctor-image">
              <img src={person.image} alt={person.name} width="600" height="600" loading={index < 2 ? "eager" : "lazy"} />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="enriched-doctor-copy">
              <p>{person.role}</p>
              <h2>{person.name}</h2>
              <p className="doctor-summary">{person.summary}</p>
              <ul>{person.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            </div>
          </article>)}
        </div>
      </section>

      <section className="cta-band team-page-cta">
        <div className="container cta-inner">
          <div><p className="eyebrow light">Atendimento Alpha</p><h2>Seu cuidado começa com<br />uma equipe preparada.</h2><p>Fale conosco para receber orientações e agendar seu exame.</p></div>
          <a className="button button-light" href="https://wa.me/552730606900" target="_blank" rel="noopener noreferrer">Agendar pelo WhatsApp <ArrowUpRight className="btn-arrow" strokeWidth={1.3} /></a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
