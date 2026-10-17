import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarCheck2, FileDown, Heart, PawPrint, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/imune/Logo";
import petDetailImage from "@/assets/pet-detail desktop.png";
import vaccinesImage from "@/assets/vaccines-desktop.png";
import petsImage from "@/assets/my-pets-desktop.png";
import "./landing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imune — Vacinas em dia, carinho sem pausa" },
      {
        name: "description",
        content:
          "Organize o histórico de vacinas dos seus pets, acompanhe as próximas aplicações e cuide de quem está sempre ao seu lado com o Imune.",
      },
      { property: "og:title", content: "Imune — Vacinas em dia, carinho sem pausa" },
      {
        property: "og:description",
        content: "Vacinas, próximas aplicações e histórico dos seus pets em um só lugar.",
      },
    ],
  }),
  component: LandingPage,
});

const steps = [
  {
    number: "01",
    title: "Cadastre seu companheiro",
    description: "Crie o perfil do pet com os dados que ajudam a contar a história dele.",
  },
  {
    number: "02",
    title: "Registre cada vacina",
    description: "Guarde a data da aplicação, a próxima dose e as observações importantes.",
  },
  {
    number: "03",
    title: "Acompanhe o que vem",
    description: "Veja as próximas datas e mantenha o cuidado sempre por perto.",
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <Link to="/" className="landing-brand" aria-label="Imune, página inicial">
            <Logo className="h-10 sm:h-11" />
            <span>
              imune<span className="text-primary">.</span>
            </span>
          </Link>
          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
          </nav>
          <div className="landing-header-actions">
            <Link to="/login" className="landing-login">
              Entrar
            </Link>
            <Button asChild size="sm" className="landing-header-cta">
              <Link to="/register">
                Criar conta <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow landing-appear">O cuidado que acompanha</p>
              <h1 id="landing-title" className="landing-appear landing-delay-1">
                Vacinas em dia.
                <br />
                <span>Carinho sem pausa.</span>
              </h1>
              <p className="landing-hero-description landing-appear landing-delay-2">
                Uma forma simples de organizar as vacinas dos seus pets e saber quando chega a
                próxima dose. Mais tempo para o que importa: estar junto.
              </p>
              <div className="landing-hero-actions landing-appear landing-delay-3">
                <Button asChild size="lg">
                  <Link to="/register">
                    Começar a cuidar <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <a href="#como-funciona" className="landing-text-link">
                  Conheça o Imune <span aria-hidden="true">↘</span>
                </a>
              </div>
              <div className="landing-hero-note landing-appear landing-delay-3">
                <span className="landing-note-icon">
                  <Heart size={16} aria-hidden="true" />
                </span>
                <span>Uma memória de cuidado para cada pet.</span>
              </div>
            </div>
            <div className="landing-hero-visual landing-appear landing-delay-2">
              <div className="landing-hero-orbit" aria-hidden="true" />
              <figure className="landing-hero-image">
                <img
                  src={petDetailImage}
                  alt="Tela do Imune com perfil da Gaia e seu histórico de vacinação"
                  fetchPriority="high"
                />
              </figure>
              <div className="landing-image-label" aria-hidden="true">
                <span className="landing-image-label-icon">
                  <CalendarCheck2 size={18} />
                </span>
                Histórico sempre por perto
              </div>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="landing-steps landing-section"
          aria-labelledby="steps-title"
        >
          <div className="landing-shell">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">Simples desde o primeiro dia</p>
              <h2 id="steps-title">Um lugar para acompanhar cada etapa.</h2>
            </div>
            <ol className="landing-steps-list">
              {steps.map((step) => (
                <li key={step.number}>
                  <span className="landing-step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="recursos"
          className="landing-vaccines landing-section"
          aria-labelledby="vaccines-title"
        >
          <div className="landing-shell landing-feature-grid">
            <div className="landing-feature-copy">
              <span className="landing-feature-icon">
                <CalendarCheck2 size={21} aria-hidden="true" />
              </span>
              <p className="landing-eyebrow">Carteira de vacinação</p>
              <h2 id="vaccines-title">Cada dose tem seu lugar. A próxima, também.</h2>
              <p className="landing-body-copy">
                Registre aplicações e datas futuras em uma carteira clara, fácil de consultar quando
                você precisar.
              </p>
              <ul className="landing-check-list">
                <li>
                  <span aria-hidden="true">✓</span> Histórico organizado por pet
                </li>
                <li>
                  <span aria-hidden="true">✓</span> Datas das próximas aplicações
                </li>
                <li>
                  <span aria-hidden="true">✓</span> Observações em cada registro
                </li>
              </ul>
            </div>
            <figure className="landing-feature-image">
              <img
                src={vaccinesImage}
                alt="Formulário do Imune para registrar vacina, data da aplicação e próxima dose"
                loading="lazy"
              />
              <figcaption>Informação certa, no momento certo.</figcaption>
            </figure>
          </div>
        </section>

        <section className="landing-pets landing-section" aria-labelledby="pets-title">
          <div className="landing-shell">
            <div className="landing-pets-heading">
              <div>
                <p className="landing-eyebrow">Toda a família por perto</p>
                <h2 id="pets-title">Um cantinho para cada pet da casa.</h2>
              </div>
              <p>
                Encontre os perfis dos seus companheiros, veja o que vem pela frente e compartilhe o
                acompanhamento com quem cuida junto.
              </p>
            </div>
            <figure className="landing-pets-image">
              <img
                src={petsImage}
                alt="Tela Meus pets do Imune, com busca e área para cadastrar um companheiro"
                loading="lazy"
              />
            </figure>
            <div className="landing-benefits">
              <div>
                <Bell aria-hidden="true" />
                <span>Notificações de vacinas próximas</span>
              </div>
              <div>
                <Users aria-hidden="true" />
                <span>Acompanhamento com cotitulares</span>
              </div>
              <div>
                <FileDown aria-hidden="true" />
                <span>Histórico do pet em PDF</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final" aria-labelledby="final-title">
          <div className="landing-shell landing-final-inner">
            <div className="landing-final-mark">
              <PawPrint size={27} aria-hidden="true" />
            </div>
            <p className="landing-eyebrow">Comece hoje</p>
            <h2 id="final-title">O próximo cuidado começa com um pequeno passo.</h2>
            <p>Crie o perfil do seu pet e mantenha a história de vacinação sempre à mão.</p>
            <div className="landing-final-actions">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">
                  Criar minha conta <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link to="/login">Já tenho conta</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <Link to="/" className="landing-brand" aria-label="Imune, página inicial">
            <Logo className="h-8" />
            <span>
              imune<span className="text-primary">.</span>
            </span>
          </Link>
          <p>Cuidado que acompanha cada fase do seu pet.</p>
          <Link to="/login">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
