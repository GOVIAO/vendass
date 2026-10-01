/**
 * VENDENDO SOLUÇÕES — INITIAL SEED DATA
 * Rich, realistic Brazilian multi-vendor catalog
 */

/**
 * CATÁLOGO DE CATEGORIAS COM IMAGEM PRÓPRIA
 *
 * Cada entrada aponta para um arquivo individual em /assets/categories/.
 * As imagens NÃO entram junto no repositório: são recortadas do catálogo
 * original e depositadas nessa pasta pelo pipeline de assets.
 *
 * `slug` é a URL pública (/categoria/<slug>) e precisa ser estável: mudar
 * um slug quebra links já indexados e compartilhados.
 *
 * Os 8 `categories` abaixo continuam existindo como eixos de navegação
 * Antigos, usados pelas pílhas do topo. As 30 de produto vivem nesta lista
 * e aparecem na grade de cards com imagem.
 */
const PRODUCT_CATEGORIES = [
  { slug: "notebooks-computadores", name: "Notebooks e Computadores", image: "/assets/categories/notebooks-computadores.webp" },
  { slug: "smartphones", name: "Smartphones", image: "/assets/categories/smartphones.webp" },
  { slug: "tablets", name: "Tablets", image: "/assets/categories/tablets.webp" },
  { slug: "fones-ouvido", name: "Fones de Ouvido", image: "/assets/categories/fones-ouvido.webp" },
  { slug: "smartwatches", name: "Smartwatches", image: "/assets/categories/smartwatches.webp" },
  { slug: "acessorios-celular", name: "Acessórios de Celular", image: "/assets/categories/acessorios-celular.webp" },
  { slug: "monitores", name: "Monitores", image: "/assets/categories/monitores.webp" },
  { slug: "teclados-mouses", name: "Teclados e Mouses", image: "/assets/categories/teclados-mouses.webp" },
  { slug: "impressoras", name: "Impressoras", image: "/assets/categories/impressoras.webp" },
  { slug: "games", name: "Games", image: "/assets/categories/games.webp" },
  { slug: "acessorios-gamer", name: "Acessórios Gamer", image: "/assets/categories/acessorios-gamer.webp" },
  { slug: "eletrodomesticos", name: "Eletrodomésticos", image: "/assets/categories/eletrodomesticos.webp" },
  { slug: "cozinha", name: "Cozinha", image: "/assets/categories/cozinha.webp" },
  { slug: "casa-decoracao", name: "Casa e Decoração", image: "/assets/categories/casa-decoracao.webp" },
  { slug: "roupas-femininas", name: "Roupas Femininas", image: "/assets/categories/roupas-femininas.webp" },
  { slug: "roupas-masculinas", name: "Roupas Masculinas", image: "/assets/categories/roupas-masculinas.webp" },
  { slug: "calcados", name: "Calçados", image: "/assets/categories/calcados.webp" },
  { slug: "bolsas-acessorios", name: "Bolsas e Acessórios", image: "/assets/categories/bolsas-acessorios.webp" },
  { slug: "ferramentas", name: "Ferramentas", image: "/assets/categories/ferramentas.webp" },
  { slug: "automotivo", name: "Automotivo", image: "/assets/categories/automotivo.webp" },
  { slug: "infantil", name: "Infantil", image: "/assets/categories/infantil.webp" },
  { slug: "pet", name: "Pet", image: "/assets/categories/pet.webp" },
  { slug: "beleza-cuidados", name: "Beleza e Cuidados", image: "/assets/categories/beleza-cuidados.webp" },
  { slug: "saude-bem-estar", name: "Saúde e Bem-estar", image: "/assets/categories/saude-bem-estar.webp" },
  { slug: "esportes", name: "Esportes", image: "/assets/categories/esportes.webp" },
  { slug: "livros", name: "Livros", image: "/assets/categories/livros.webp" },
  { slug: "papelaria", name: "Papelaria", image: "/assets/categories/papelaria.webp" },
  { slug: "bebes", name: "Bebês", image: "/assets/categories/bebes.webp" },
  { slug: "alimentos-bebidas", name: "Alimentos e Bebidas", image: "/assets/categories/alimentos-bebidas.webp" },
  { slug: "produtos-diversos", name: "Produtos Diversos", image: "/assets/categories/produtos-diversos.webp" }
];

const INITIAL_DATA = {
  productCategories: PRODUCT_CATEGORIES,

  categories: [
    { id: "cat-todos", name: "Todos", icon: "grid", slug: "todos" },
    { id: "cat-tec", name: "Tecnologia & Software", icon: "cpu", slug: "tecnologia" },
    { id: "cat-eletronicos", name: "Eletrônicos & Celulares", icon: "smartphone", slug: "eletronicos" },
    { id: "cat-servicos", name: "Serviços & Consultoria", icon: "briefcase", slug: "servicos" },
    { id: "cat-logistica", name: "Logística & Entregas", icon: "truck", slug: "logistica" },
    { id: "cat-moda", name: "Moda & Acessórios", icon: "shopping-bag", slug: "moda" },
    { id: "cat-beleza", name: "Beleza & Sustentabilidade", icon: "heart", slug: "beleza" },
    { id: "cat-casa", name: "Casa & Escritório", icon: "home", slug: "casa" },
    { id: "cat-ferramentas", name: "Ferramentas & Indústria", icon: "tool", slug: "ferramentas" }
  ],

  stores: [
    {
      id: "store-technova",
      name: "TechNova Soluções Digitais",
      slug: "technova",
      legalName: "TechNova Inovações Tecnológicas Ltda",
      cnpj: "34.892.110/0001-45",
      category: "Tecnologia & Software",
      rating: 4.9,
      reviewCount: 428,
      verified: true,
      city: "São Paulo",
      state: "SP",
      responseTime: "< 1 hora",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
      description: "Especializada em softwares ERP na nuvem, automação comercial, APIs de integração e hardware corporativo de alta performance.",
      policies: "Garantia estendida de 12 meses. Suporte humanizado 24/7. Devoluções e cancelamentos conformes CDC Art. 49."
    },
    {
      id: "store-nexus-log",
      name: "Nexus Logística Express",
      slug: "nexus-logistica",
      legalName: "Nexus Transportes e Soluções Logísticas S.A.",
      cnpj: "18.421.908/0001-12",
      category: "Logística & Entregas",
      rating: 4.8,
      reviewCount: 890,
      verified: true,
      city: "Curitiba",
      state: "PR",
      responseTime: "< 30 minutos",
      logo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&auto=format&fit=crop&q=80",
      description: "Rede integrada de distribuição rápida com frota elétrica e rastreamento em tempo real em todas as capitais e regiões metropolitanas do Brasil.",
      policies: "Seguro total contra extravio incluso em todas as remessas. Código de rastreamento com webhook em tempo real."
    },
    {
      id: "store-raizes",
      name: "Raízes & Tradição Moda Inclusiva",
      slug: "raizes-tradicao",
      legalName: "Raízes Indústria e Comércio de Moda Autoral Ltda",
      cnpj: "45.109.876/0001-90",
      category: "Moda & Acessórios",
      rating: 5.0,
      reviewCount: 312,
      verified: true,
      city: "Salvador",
      state: "BA",
      responseTime: "< 2 horas",
      logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
      description: "Moda sustentável, adaptada e inclusiva. Peças criadas por designers negros, indígenas e pessoas com deficiência, valorizando a diversidade e ancestralidade brasileira.",
      policies: "Troca grátis na primeira devolução. Embalagens 100% biodegradáveis. Garantia legal de 90 dias."
    },
    {
      id: "store-inovawork",
      name: "InovaWork Consultoria & Gestão",
      slug: "inovawork",
      legalName: "InovaWork Gestão Empresarial e Assessoria Ltda",
      cnpj: "29.831.654/0001-33",
      category: "Serviços & Consultoria",
      rating: 4.9,
      reviewCount: 154,
      verified: true,
      city: "Belo Horizonte",
      state: "MG",
      responseTime: "< 1 hora",
      logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      description: "Assessoria tributária, financeira e conformidade com a LGPD para pequenas e médias empresas que desejam escalar com segurança jurídica.",
      policies: "Acordo de Confidencialidade (NDA) assinado digitalmente. Relatório de conformidade entregue em até 7 dias úteis."
    },
    {
      id: "store-ecovida",
      name: "EcoVida BioCosméticos",
      slug: "ecovida",
      legalName: "EcoVida Cosméticos da Amazônia Ltda",
      cnpj: "51.340.298/0001-77",
      category: "Beleza & Sustentabilidade",
      rating: 4.9,
      reviewCount: 520,
      verified: true,
      city: "Manaus",
      state: "AM",
      responseTime: "< 3 horas",
      logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop&q=80",
      description: "Cosméticos veganos com bioativos rastreáveis da floresta amazônica. Cruelty-free, sem parabenos e com impacto socioambiental positivo para cooperativas locais.",
      policies: "Selo IBD de Ingredientes Naturais. Embalagens recicláveis com logística reversa cooperada."
    },
    {
      id: "store-cybershield",
      name: "CyberShield Pentest & Defesa Digital",
      slug: "cybershield",
      legalName: "CyberShield Segurança e Inteligência Cibernética Ltda",
      cnpj: "38.712.940/0001-88",
      category: "Tecnologia & Software",
      rating: 5.0,
      reviewCount: 97,
      verified: true,
      city: "Brasília",
      state: "DF",
      responseTime: "< 30 minutos",
      logo: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
      description: "Auditorias de segurança cibernética, testes de invasão éticos (pentest), adequação técnica à LGPD e proteção contra vazamento de dados em comércio eletrônico.",
      policies: "Acordo de confidencialidade (NDA) imediato. Laudo técnico assinado por perito certificado CISSP."
    },
    {
      id: "store-artesaos",
      name: "Artesãos do Brasil - Cooperativa Criativa",
      slug: "artesaos-brasil",
      legalName: "Cooperativa Central de Artesãos e Designers Brasileiros",
      cnpj: "14.289.501/0001-62",
      category: "Casa & Escritório",
      rating: 4.9,
      reviewCount: 380,
      verified: true,
      city: "Recife",
      state: "PE",
      responseTime: "< 1 hora",
      logo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80",
      description: "Cerâmica marajoara, cestaria indígena, biojoias e tear manual. Comércio justo que valoriza as comunidades tradicionais e preserva a cultura brasileira.",
      policies: "Embalagens sustentáveis e seguras contra avarias. Certificado de autenticidade da cooperativa em cada peça."
    },
    {
      id: "store-autotech",
      name: "AutoTech Eletromobilidade & Carregadores",
      slug: "autotech",
      legalName: "AutoTech Soluções em Mobilidade Sustentável S.A.",
      cnpj: "22.610.893/0001-04",
      category: "Ferramentas & Indústria",
      rating: 4.8,
      reviewCount: 215,
      verified: true,
      city: "Campinas",
      state: "SP",
      responseTime: "< 1 hora",
      logo: "https://images.unsplash.com/photo-1558441719-8b489c63f732?w=150&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&auto=format&fit=crop&q=80",
      description: "Carregadores inteligentes Wallbox para veículos elétricos e híbridos, cabos tipo 2 e estações de recarga rápida homologadas pelo Inmetro.",
      policies: "Garantia nacional de 2 anos pelo fabricante. Homologação Inmetro e Anatel."
    }
  ],

  products: [
    {
      id: "prod-1",
      storeId: "store-technova",
      type: "product",
      title: "Notebook Pro Ultrafino 16\" AI Edition - 32GB RAM / 1TB SSD",
      category: "cat-tec",
      price: 6499.00,
      originalPrice: 7899.00,
      stock: 14,
      rating: 4.9,
      reviewsCount: 88,
      isFeatured: true,
      isFlashDeal: true,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
      description: "Equipado com processador de última geração e NPU dedicada para tarefas de inteligência artificial. Tela Retina 120Hz com cores calibradas para profissionais criativos e desenvolvedores.",
      variations: [
        { name: "Cor", options: ["Cinza Espacial", "Prata Estelar", "Azul Meia-Noite"] },
        { name: "Armazenamento", options: ["1TB NVMe", "2TB NVMe"] }
      ],
      specs: {
        "Processador": "Octa-Core com NPU IA 45 TOPS",
        "Memória RAM": "32GB LPDDR5X",
        "Armazenamento": "1TB SSD NVMe Gen 4",
        "Tela": "16 polegadas Liquid OLED 3.2K 120Hz",
        "Bateria": "Até 18 horas de autonomia",
        "Peso": "1.49 kg"
      },
      shipping: { weightKg: 1.5, dimensions: "35 x 24 x 1.6 cm", estimatedDays: 2 }
    },
    {
      id: "prod-2",
      storeId: "store-technova",
      type: "service",
      title: "Plano ERP Cloud 'Solução Total' - Assinatura Anual para PMEs",
      category: "cat-tec",
      price: 1890.00,
      originalPrice: 2400.00,
      stock: 999,
      rating: 5.0,
      reviewsCount: 142,
      isFeatured: true,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
      description: "Sistema de gestão completo com emissão automática de NF-e, controle de estoque multiloja, PDV web, integração bancária com conciliação PIX instantânea e relatórios fiscais.",
      variations: [
        { name: "Licenças", options: ["Até 5 Usuários", "Até 15 Usuários", "Ilimitado"] }
      ],
      specs: {
        "Implantação": "100% Remota com Suporte Dedicado",
        "Armazenamento": "Ilimitado em Nuvem Certificada ISO 27001",
        "Backup": "Automático diário com criptografia de ponta a ponta",
        "Conformidade": "Totalmente integrado às exigências do SPED e LGPD"
      },
      shipping: { weightKg: 0, dimensions: "Serviço Digital", estimatedDays: 0 }
    },
    {
      id: "prod-3",
      storeId: "store-raizes",
      type: "product",
      title: "Jaqueta Utilitária Adaptativa Unissex - Fecho Magnético Inclusivo",
      category: "cat-moda",
      price: 349.90,
      originalPrice: 420.00,
      stock: 25,
      rating: 5.0,
      reviewsCount: 64,
      isFeatured: true,
      isFlashDeal: true,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
      description: "Desenvolvida com consultoria de pessoas com mobilidade reduzida. Possui fechamento magnético invisível super resistente, tecido respirável em algodão agroecológico e bolsos ergonômicos.",
      variations: [
        { name: "Tamanho", options: ["PP", "P", "M", "G", "GG", "XGG", "G3"] },
        { name: "Cor", options: ["Terracota Ancestral", "Verde Mata", "Preto Carvão"] }
      ],
      specs: {
        "Composição": "100% Algodão Agroecológico Certificado",
        "Fechamentos": "Ímãs de neodímio encapados à prova d'água",
        "Origem": "Feito no Brasil por cooperativas locais"
      },
      shipping: { weightKg: 0.6, dimensions: "30 x 20 x 5 cm", estimatedDays: 3 }
    },
    {
      id: "prod-4",
      storeId: "store-ecovida",
      type: "product",
      title: "Kit Regeneração Florestal - Sérum Facial Pracaxi & Creme Noturno Cupuaçu",
      category: "cat-beleza",
      price: 189.00,
      originalPrice: 235.00,
      stock: 40,
      rating: 4.8,
      reviewsCount: 119,
      isFeatured: true,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1608248597359-57508e6f1f3a?w=600&auto=format&fit=crop&q=80",
      description: "Poderosa ação antioxidante e hidratante com óleos prensados a frio colhidos de forma sustentável por comunidades ribeirinhas do Amazonas. Cruelty-free e dermatologicamente testado.",
      variations: [
        { name: "Tipo de Pele", options: ["Para Todos os Tipos", "Peles Sensíveis", "Peles Oleosas"] }
      ],
      specs: {
        "Volume": "Sérum 30ml + Creme 50g",
        "Certificação": "IBD Cosméticos Naturais e Selo Eureciclo",
        "Validade": "24 meses"
      },
      shipping: { weightKg: 0.35, dimensions: "15 x 12 x 8 cm", estimatedDays: 3 }
    },
    {
      id: "prod-5",
      storeId: "store-inovawork",
      type: "service",
      title: "Diagnóstico e Adequação LGPD Express para Pequenas Empresas",
      category: "cat-servicos",
      price: 1250.00,
      originalPrice: 1600.00,
      stock: 20,
      rating: 4.9,
      reviewsCount: 57,
      isFeatured: true,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
      description: "Mapeamento completo do fluxo de dados pessoais da sua empresa, elaboração de Política de Privacidade e Termos de Uso personalizados, e treinamento online para equipe.",
      variations: [
        { name: "Porte da Empresa", options: ["MEI / Autônomo", "Microempresa (ME)", "Empresa de Pequeno Porte (EPP)"] }
      ],
      specs: {
        "Entregáveis": "Relatório ROPA, Políticas customizadas e Termos de Consentimento",
        "Prazo de Entrega": "7 dias úteis",
        "Formato": "Online com DPO certificado"
      },
      shipping: { weightKg: 0, dimensions: "Serviço Consultivo", estimatedDays: 0 }
    },
    {
      id: "prod-6",
      storeId: "store-nexus-log",
      type: "service",
      title: "Assinatura Coleta Diária & Frete Fixo Capitais - Plano E-commerce",
      category: "cat-logistica",
      price: 380.00,
      originalPrice: 490.00,
      stock: 50,
      rating: 4.9,
      reviewsCount: 94,
      isFeatured: false,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
      description: "Coleta porta a porta diária para lojas virtuais em capitais, com tabela reduzida de frete e painel com despacho simplificado e API integrada.",
      variations: [
        { name: "Frequência", options: ["Segunda a Sexta", "Todos os Dias"] }
      ],
      specs: {
        "Área de Coleta": "Capitais de SP, PR, SC, RS, MG, RJ, BA",
        "Rastreio": "Live GPS para o destinatário final"
      },
      shipping: { weightKg: 0, dimensions: "Contrato Logístico", estimatedDays: 0 }
    },
    {
      id: "prod-7",
      storeId: "store-autotech",
      type: "product",
      title: "Wallbox Smart 7.4kW Conector Tipo 2 para Carros Elétricos com Wi-Fi",
      category: "cat-ferramentas",
      price: 3490.00,
      originalPrice: 4100.00,
      stock: 12,
      rating: 4.9,
      reviewsCount: 38,
      isFeatured: true,
      isFlashDeal: true,
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80",
      description: "Estação de recarga residencial e comercial para veículos elétricos e híbridos plug-in. Conexão Wi-Fi com agendamento de recarga e medição de consumo por aplicativo.",
      variations: [
        { name: "Cabo", options: ["Cabo Integrado 5m", "Cabo Integrado 7.5m"] }
      ],
      specs: {
        "Potência": "7.4 kW (Monofásico 32A)",
        "Conector": "Tipo 2 (Padrão Europeu / Brasileiro)",
        "Grau de Proteção": "IP65 à prova de chuva e poeira",
        "Garantia": "24 meses nacional"
      },
      shipping: { weightKg: 4.2, dimensions: "38 x 26 x 14 cm", estimatedDays: 2 }
    },
    {
      id: "prod-8",
      storeId: "store-cybershield",
      type: "service",
      title: "Auditoria de Segurança Pentest Web & Mobile para E-commerce com Laudo",
      category: "cat-tec",
      price: 2850.00,
      originalPrice: 3500.00,
      stock: 15,
      rating: 5.0,
      reviewsCount: 41,
      isFeatured: true,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      description: "Teste de invasão ético em conformidade com o OWASP Top 10 e exigências da LGPD. Mapeamento de vulnerabilidades em APIs, bancos de dados e interfaces de pagamento.",
      variations: [
        { name: "Escopo", options: ["Plataforma Web Completa", "Web + API Mobile"] }
      ],
      specs: {
        "Certificação": "Executado por perito OSCP e CISSP",
        "Entregável": "Laudo técnico executivo com plano de remediação",
        "Prazo": "5 a 10 dias úteis com re-teste incluso"
      },
      shipping: { weightKg: 0, dimensions: "Serviço Técnico", estimatedDays: 0 }
    },
    {
      id: "prod-9",
      storeId: "store-artesaos",
      type: "product",
      title: "Conjunto Decorativo Vasos Cerâmica Marajoara com Certificado de Origem",
      category: "cat-casa",
      price: 289.00,
      originalPrice: 340.00,
      stock: 18,
      rating: 4.9,
      reviewsCount: 76,
      isFeatured: true,
      isFlashDeal: false,
      image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80",
      description: "Peças exclusivas moldadas à mão por mestres artesãos do Pará, utilizando argila natural e grafismos ancestrais da cultura Marajoara. Acompanha selo de procedência ética.",
      variations: [
        { name: "Tonalidade", options: ["Argila Natural Terracota", "Grafismo Bicolor Preto e Branco"] }
      ],
      specs: {
        "Material": "Argila mineral tratada e pigmentos vegetais",
        "Dimensões": "Trio com alturas 28cm, 22cm e 16cm",
        "Origem": "Ilha de Marajó - Cooperativa Criativa"
      },
      shipping: { weightKg: 2.1, dimensions: "35 x 30 x 25 cm", estimatedDays: 4 }
    },
    {
      id: "prod-10",
      storeId: "store-technova",
      type: "product",
      title: "Smartphone Quantum Pro 5G 256GB - Tela AMOLED 120Hz e Câmera 108MP",
      category: "cat-eletronicos",
      price: 2399.00,
      originalPrice: 2999.00,
      stock: 22,
      rating: 4.8,
      reviewsCount: 112,
      isFeatured: true,
      isFlashDeal: true,
      image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
      description: "Conectividade 5G ultrarrápida, carregamento Turbo 67W de 0 a 100% em 38 minutos, sensor biométrico sob a tela e câmera tripla com inteligência artificial para fotos noturnas.",
      variations: [
        { name: "Cor", options: ["Grafite Titanium", "Azul Glacial", "Verde Esmeralda"] },
        { name: "Memória", options: ["8GB RAM / 256GB", "12GB RAM / 512GB"] }
      ],
      specs: {
        "Processador": "Snapdragon Octa-Core 5G",
        "Bateria": "5.000 mAh com Carregador 67W Incluso",
        "Tela": "6.67\" FHD+ AMOLED 120Hz HDR10+",
        "Garantia": "12 meses Anatel"
      },
      shipping: { weightKg: 0.45, dimensions: "18 x 9 x 6 cm", estimatedDays: 2 }
    }
  ],

  ordersSeed: [
    {
      id: "ORD-9481",
      date: "2026-09-26T14:30:00",
      status: "Em Transporte",
      trackingCode: "VS948123789BR",
      carrier: "Nexus Express",
      total: 6848.90,
      customer: {
        name: "Carlos Eduardo Silva",
        email: "carlos.silva@exemplo.com.br",
        phone: "(11) 98765-4321",
        address: "Av. Paulista, 1578, Apto 82, Bela Vista, São Paulo - SP, 01310-200"
      },
      subOrders: [
        {
          storeId: "store-technova",
          storeName: "TechNova Soluções Digitais",
          items: [
            { productId: "prod-1", title: "Notebook Pro Ultrafino 16\" AI Edition", price: 6499.00, qty: 1 }
          ],
          shippingMethod: "Nexus Express Urgente",
          shippingCost: 0.00,
          status: "Despachado",
          trackingCode: "VS948123789BR"
        },
        {
          storeId: "store-raizes",
          storeName: "Raízes & Tradição Moda Inclusiva",
          items: [
            { productId: "prod-3", title: "Jaqueta Utilitária Adaptativa Unissex", price: 349.90, qty: 1 }
          ],
          shippingMethod: "SEDEX Rápido",
          shippingCost: 0.00,
          status: "Em Separação",
          trackingCode: "BR389102938SP"
        }
      ],
      payment: {
        method: "PIX",
        status: "Aprovado",
        paidAt: "2026-09-26T14:32:10"
      }
    }
  ],

  carriers: [
    { id: "carrier-nexus", name: "Nexus Logística Express", prazo: "1 a 2 dias úteis", preco: 22.90, badge: "Mais Rápido" },
    { id: "carrier-sedex", name: "Correios SEDEX", prazo: "2 a 3 dias úteis", preco: 28.50, badge: "Tradicional" },
    { id: "carrier-pac", name: "Correios PAC", prazo: "5 a 8 dias úteis", preco: 16.90, badge: "Mais Econômico" },
    { id: "carrier-loggi", name: "Loggi Transportes", prazo: "1 a 3 dias úteis", preco: 24.00, badge: "Rastreio em Tempo Real" }
  ],

  securityAuditLogs: [
    { id: "LOG-01", date: "2026-09-27 18:20:11", type: "LOGIN_SUCCESS", user: "carlos.silva@exemplo.com.br", ip: "177.136.24.10", details: "Autenticação multifator via e-mail confirmada com sucesso." },
    { id: "LOG-02", date: "2026-09-27 17:45:00", type: "STORE_APPROVAL", user: "admin@vendendosolucoes.com.br", ip: "189.40.12.8", details: "Loja 'Raízes & Tradição' validada após checagem de CNPJ e alvará." },
    { id: "LOG-03", date: "2026-09-27 16:10:44", type: "RATE_LIMIT_BLOCK", user: "185.220.101.5", ip: "185.220.101.5", details: "Tentativas excessivas de login detectadas. IP bloqueado por 15 minutos." },
    { id: "LOG-04", date: "2026-09-27 15:02:18", type: "LGPD_DATA_EXPORT", user: "mariana.costa@exemplo.com.br", ip: "201.82.90.15", details: "Titular solicitou exportação integral dos dados cadastrais (Art. 18 LGPD)." }
  ],

  reportsSeed: [
    {
      id: "REP-101",
      date: "2026-09-25",
      reportedItem: "Tech Gadget Store (Mock)",
      reportedType: "Loja",
      reason: "Suspeita de produto sem nota fiscal",
      reporter: "Anônimo",
      status: "Em Análise",
      details: "Solicitada verificação de procedência e nota fiscal de importação."
    }
  ]
};
