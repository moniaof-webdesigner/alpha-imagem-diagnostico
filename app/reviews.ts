export type Review = {
  author: string;
  rating: 4 | 5;
  relativeTime: string;
  text: string;
  sourceLabel: "Google";
  reviewUri?: string;
  photoUri?: string;
};

export type ReviewsData = {
  reviews: Review[];
  sourceUri?: string;
};

// GOOGLE_REVIEWS_INTEGRATION_HOOK
// Fonte atual: seleção manual de avaliações reais fornecidas pela Alpha.
// Não inserir avaliações inventadas ou textos sem confirmação da origem.
const manualReviews: Review[] = [
  {
    author: "Aline Tonon",
    rating: 5,
    relativeTime: "1 mês atrás",
    sourceLabel: "Google",
    text: "Minha experiência foi excelente do início ao fim! Desde o primeiro atendimento na recepção até todo o acompanhamento durante o tratamento, fui muito bem acolhida. A equipe é extremamente atenciosa, educada e profissional, sempre transmitindo segurança e cuidado em cada etapa. O atendimento é realmente impecável, e isso faz toda a diferença. Só tenho a agradecer pelo carinho, dedicação e excelência de todos. Recomendo de olhos fechados!",
  },
  {
    author: "Walter Pessoa",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Fui com minha esposa e quero agradecer pelo excelente atendimento das profissionais Patrícia Souza e doutora Janine Machado. Muito atenciosas, acolhedoras e humanas. Toda nossa gratidão pelo carinho e cuidado!",
  },
  {
    author: "Victória Avíres",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Gostei muito da experiência, houve um pequeno atraso mas nada demais, ótimos médicos e atendentes!!! A atendente Verônica que realizou meu atendimento, nota 10, super atenciosa e conseguiu me ajudar antecipar meus exames!! O número deles mudaram ficou muito melhor.",
  },
  {
    author: "Leticia Souza",
    rating: 5,
    relativeTime: "4 meses atrás",
    sourceLabel: "Google",
    text: "Gostaria de registrar minha satisfação com o atendimento da clínica. Fui muito bem atendida por toda a equipe médica, que demonstrou profissionalismo, atenção e cuidado durante todo o processo.\n\nTambém deixo um agradecimento especial ao colaborador da clínica Denner Keller, cuja proatividade e indicação foram fundamentais para que eu escolhesse a clínica. Sua orientação fez toda a diferença na minha experiência.\n\nRecomendo o serviço com confiança!",
  },
  {
    author: "Jackeline Souza",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Fui muito bem atendida pela Dra Vanessa a mesma muito agradável me deixando a vontade durante os exames. Ambiente aconchegante, equipe maravilhosa da recepção e atendentes.",
  },
  {
    author: "Karol Ribeiro",
    rating: 4,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Melhor lugar possível, fui atendido pelo recepcionista magrinho, muito atencioso!!!! Me ajudou com o acesso ao resultado online, ficou muito melhor!! Atendimento rápido e eficiente no novo número.",
  },
  {
    author: "nayob victoria",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Vi uma paciente reclamando que chegou cedo e queria ser atendida antes do horário que ela havia agendado! Eu cheguei no horário certinho e fui atendida no meu horário agendado, e se me pedisse pra passar ela na frente eu não ia concordar, quer ser atendida antes, marca o 1 horário!! Ótimo lugar recomendo.",
  },
  {
    author: "Jacirlene Pessoa",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Quero deixar minha admiração às profissionais Patrícia Souza e doutora Janine Machado. Atendimento maravilhoso, humano e acolhedor. Obrigada pelo carinho e atenção!",
  },
  {
    author: "Natália Luisa",
    rating: 4,
    relativeTime: "1 ano atrás",
    sourceLabel: "Google",
    text: "Fiz 3 exames já na clínica. O agendamento pelo WhatsApp é direto e eficiente, e só em uma das vezes houve demora. Em geral, foi rápido. O atendimento das recepcionistas é educado. Os médicos que me atenderam foram claros e respeitosos e não houve atraso. Há rampa para acessibilidade. Atende alguns convênios.",
  },
  {
    author: "Ludimila Contarato",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Excelente o atendimento, desde a marcação até às médicas .. a moça que fez a minha mamografia extremamente paciente pois estava com medo, adorei a Marcela e os demais também. Indico mesmo o telefone deles mudaram e não estava conseguindo falar, mais depois foi super tranquilo!",
  },
  {
    author: "Paula Benfica",
    rating: 5,
    relativeTime: "2 meses atrás",
    sourceLabel: "Google",
    text: "Ótimo lugar para realizar os exames em Vitória, recepcionista atenciosos e super eficientes!!!! O número de contato deles mudaram o robozinho facilita muito o atendimento, atendente isaque muito atencioso!",
  },
];

// Este adaptador mantém a apresentação independente da origem dos dados.
// Futuramente, somente esta função precisará ser conectada ao provedor escolhido
// (SociableKIT, Elfsight ou outro), sem redesenhar o carrossel.
export async function getReviews(): Promise<ReviewsData> {
  return {
    reviews: manualReviews.filter((review) => review.rating >= 4),
  };
}
