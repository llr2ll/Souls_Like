# Teste manual (poucos minutos, depois de cada PR)

Marque cada item. Se algo der errado, anote o número do item e o que aconteceu, e mande para a IA.
Cada PR acrescenta os itens dele aqui.

## Preparar (1 min)
1. No Codespaces, pegue a branch do PR (ou a `main` depois do merge) e rode `npm install`.
2. Rode `npm run dev` e abra o jogo no navegador (porta 5173).

## Checklist
| # | Teste | O que você deve ver | ✓ |
|---|---|---|---|
| 1 | **Abrir** | O peregrino (por enquanto com a roupa do Samurai) no meio de uma arena de terra, com muro baixo de pedra em volta. FPS em verde no canto | ☐ |
| 2 | **Andar** com W A S D | Ele anda nas 8 direções, vira o corpo com peso (não estala) e a câmera vai junto, suave | ☐ |
| 3 | **Correr**: segure Espaço andando | Depois de um instante, corre. A barra verde no alto, à esquerda, desce. Zerou: a barra fica apagada e ele volta a andar até recuperar um pouco | ☐ |
| 4 | **Bater nas coisas**: ande contra o muro, o cruceiro, o hórreo, as árvores e as pedras | Ele para; não atravessa nada | ☐ |
| 5 | **Casa**: vá até a casa de pedra (à esquerda, mais para cima) e entre pela porta | A porta abre sozinha. Ao entrar, o telhado some e você vê os móveis | ☐ |
| 6 | **Escada**: dentro da casa, ache a escada no fundo e suba | Ele sobe para o andar de cima e o recorte mostra o andar de cima | ☐ |
| 7 | **Atrás da casa**: dê a volta e fique atrás dela | A parte da casa que tapava você fica baixinha (você continua visível) | ☐ |
| 8 | **Som**: aperte M | Liga/desliga o som (a porta faz barulho ao abrir e fechar) | ☐ |
| 9 | **Câmera olha à frente** (S1): ande reto para um lado por uns segundos, depois pare | Andando, o peregrino fica um pouco atrás do meio da tela: aparece mais chão do lado para onde ele vai. Parado, a câmera volta devagar a centralizar, sem tranco | ☐ |
| 10 | **Boneco de treino** (S3): logo à frente de onde você começa | Um poste com saco de palha. Ele não deixa passar | ☐ |
| 11 | **Conectar o controle** (S1): plugue (USB ou Bluetooth) e aperte qualquer botão. Use o jogo numa aba normal do Chrome ou Edge (a prévia dentro do VS Code pode não enxergar o controle) | Aviso "Controle conectado: …" no alto da tela. A ajuda no canto de baixo muda para os botões do controle | ☐ |
| 12 | **Stick esquerdo**: incline pouco, depois tudo, depois solte | Pouco: anda devagar. Tudo: anda normal. Solto: para (não fica andando sozinho) | ☐ |
| 13 | **Segure B** andando | Corre, igual a segurar Espaço (correndo muito tempo, cansa) | ☐ |
| 14 | **RB perto do boneco** | Golpe leve; o controle vibra rapidinho ao acertar (no Firefox não vibra) | ☐ |
| 15 | **Outros botões** (A, X, LT, R3, direcional) | Nada acontece ainda, e o jogo não trava | ☐ |
| 16 | **Desligar o controle** (ou tirar o cabo) | Aviso "Controle desconectado". O teclado continua funcionando | ☐ |
| 17 | **Rolar** (S2): ande e toque Espaço (ou B) rapidinho | Ele dá uma cambalhota para o lado em que você anda (~3,5 m), com um "hup" e um baque no fim. A barra verde perde um pedaço | ☐ |
| 18 | **Rolar parado** | Rola para a frente (para onde ele está virado) | ☐ |
| 19 | **Rolar em sequência**: toque de novo no fim da cambalhota | A 2ª sai emendada, sem precisar acertar o instante exato | ☐ |
| 20 | **Rolar até cansar**: toque várias vezes seguidas | Rola enquanto houver qualquer pedaço de verde. Sem verde, não rola. Com pouco fôlego, ele respira ofegante | ☐ |
| 21 | **Fôlego volta**: pare depois de rolar | A barra espera meio segundo e então enche rápido | ☐ |
| 22 | **Rolar contra o muro** | Ele para no muro (não atravessa) | ☐ |
| 23 | **Golpe leve** (S3): perto do boneco, clique (ou RB) 3 vezes no ritmo | Dois cortes e uma estocada. Cada acerto: o boneco pisca branco, balança, um "tchac", e o jogo dá uma travadinha de nada (é de propósito: peso) | ☐ |
| 24 | **Rastro**: olhe a lâmina no golpe | Uma fita clara aparece só no instante em que a lâmina corta, e some rápido | ☐ |
| 25 | **Golpe pesado**: Shift + clique (ou RT) | Ergue a espada, segura um instante e desce com tudo. Acertando: travadinha maior e a tela treme de leve | ☐ |
| 26 | **Compromisso**: comece um golpe e tente andar | Não anda até o golpe acabar (só dá um passinho para a frente) | ☐ |
| 27 | **Cancelar com rolamento**: golpe e logo depois do impacto toque Espaço | Rola na hora. Se tocar antes do impacto, o rolamento espera o impacto | ☐ |
| 28 | **Guardar o próximo golpe**: clique de novo pouco antes do fim de um golpe | O próximo sai emendado. Clicando cedo demais, o clique é ignorado | ☐ |
| 29 | **Fôlego**: bata sem parar | Cada golpe gasta verde; com qualquer verde ainda bate; sem verde, espera. Durante golpes e rolamentos o verde não volta | ☐ |
| 30 | **Travar** (S4): perto dos bonecos, aperte Q (ou R3, apertando o stick direito) | Um círculo claro aparece no boneco mais perto para onde você olha, com um "tic". A câmera se afasta um pouco para mostrar os dois | ☐ |
| 31 | **Andar travado** | Ele anda de lado e de costas, sempre de frente para o boneco | ☐ |
| 32 | **Trocar de alvo**: roda do mouse (ou stick direito puxado para o lado) | O círculo pula para o outro boneco, do lado que você puxou | ☐ |
| 33 | **Golpe travado**: com o stick apontando para outro lado, clique (ou RB) | O golpe vai no alvo travado | ☐ |
| 34 | **Correr e rolar travado** | Correndo, ele vira para onde corre; rolando, rola para onde o stick aponta | ☐ |
| 35 | **Soltar**: Q de novo; ou corra para longe; ou se esconda atrás da casa | Solta na hora; longe (18 m) solta sozinho; escondido, solta depois de 2 s | ☐ |
| 36 | **Romeiro** (S5): vá para o sul da arena, perto da árvore da esquerda | Um morto com bordão e foice. Quando te vê, para, geme e vem andando devagar | ☐ |
| 37 | **Pancada**: deixe ele chegar | Ergue o bordão bem alto (gemido grave), segura um instante e desce. Antes de descer dá tempo de reagir | ☐ |
| 38 | **Dois cortes** (de perto) | Puxa a foice para trás com o corpo torcido (rosnado curto) e corta duas vezes | ☐ |
| 39 | **Rolar para o lado** no fim do aviso | O golpe passa e não te acerta | ☐ |
| 40 | **Punir**: depois da pancada o bordão fica no chão um instante | Dá para bater 1 ou 2 vezes. Ele pisca, tropeça e geme | ☐ |
| 41 | **Bater no meio do aviso** | Ele não para: termina o golpe (não dá para trocar golpe com ele) | ☐ |
| 42 | **Levar golpe** | Barra vermelha desce (o pedaço perdido fica claro e some devagar), você tropeça para trás, a tela treme e o controle vibra | ☐ |
| 43 | **Travar nele** (Q) | Uma barrinha vermelha aparece sobre ele e desce a cada acerto | ☐ |
| 44 | **Vencer** | Ele cai e, depois de uns segundos, afunda no chão | ☐ |
| 45 | **Morrer** | "A névoa te levou". Em uns segundos você volta (no começo ou no cruceiro, ver item 67) com tudo cheio e o Romeiro volta para o lugar dele | ☐ |
| 46 | **Fugir** | Longe o bastante, ele desiste e volta andando para onde estava | ☐ |
| 47 | **Escudo** (S6): segure o clique direito (ou LB) | O peregrino ergue a rodela de madeira na frente do peito e anda devagar | ☐ |
| 48 | **Segurar golpe** de frente para o Romeiro | Baque de madeira e faísca pequena; a vida não desce, o fôlego desce | ☐ |
| 49 | **Escudo de costas** | Golpe pelas costas passa (o escudo só protege a frente) | ☐ |
| 50 | **Guarda quebrada**: segure golpes até o fôlego acabar | O escudo cai, ele fica atordoado 1 s (aberto a tudo) | ☐ |
| 51 | **Aparar**: Shift + clique direito (ou LT) bem na hora em que o golpe vai acertar | Faísca grande, "tlin", tudo fica lento um instante e o Romeiro cai de joelhos com a arma brilhando | ☐ |
| 52 | **Aparar cedo ou tarde** | Não apara: ele fica aberto meio segundo (e leva o golpe) | ☐ |
| 53 | **Postura**: trave nele (Q) e bata 3 vezes seguidas | Sob a barra de vida, uma barra dourada enche a cada golpe; cheia, ele cai de joelhos. Parando de bater, ela esvazia | ☐ |
| 54 | **Golpe crítico**: com ele de joelhos, chegue perto e clique (ou RB) | Uma estocada funda: a câmera chega perto, a tela treme, tira muito (36). Só um por vez: depois ele levanta | ☐ |
| 55 | **Placar** (S7): olhe o canto de baixo, à esquerda | Cabaça com 4 e pão com 3 | ☐ |
| 56 | **Beber**: leve um golpe e aperte R (ou X) | Leva a cabaça à boca, cabeça para trás, gole. Logo depois: sininhos, anel dourado no chão, vida sobe. A cabaça mostra 3 e pisca | ☐ |
| 57 | **Andar bebendo** | Anda bem devagar; não dá para rolar nem bater até terminar | ☐ |
| 58 | **Golpe no meio do gole**: beba perto do Romeiro e deixe ele acertar antes dos sininhos | Som seco: o gole se perdeu (a cabaça já desceu, a vida não subiu) | ☐ |
| 59 | **Pão**: aperte F (ou Y) | Mastiga rapidinho e cura um pouco. O pão mostra 2 | ☐ |
| 60 | **Cabaça vazia**: beba até zerar e aperte de novo | "A cabaça está vazia". Morrendo e voltando ao começo, ela enche de novo | ☐ |
| 61 | **Pouca vida**: fique com menos de um quarto | Borda vermelha pulsando em volta da tela | ☐ |
| 62 | **Começar do zero** (S8): abra o jogo com `?novo` no fim do endereço (ex.: `…:5173/?novo`) | Começa sem progresso. Sem o `?novo`, o jogo continua de onde parou | ☐ |
| 63 | **Cruceiro**: chegue perto da cruz de pedra (à direita do começo) | Aviso embaixo: "E · Descansar no Cruceiro da arena" (no controle, "A") | ☐ |
| 64 | **Descansar** (E ou A) | Primeira vez: "Vela acesa" grande, sininhos, as velinhas do pé acendem. Vida e cabaça cheias; o Romeiro volta ao lugar | ☐ |
| 65 | **Descansar com inimigo atrás** | "Não dá para descansar com inimigos por perto" | ☐ |
| 66 | **Cera**: vença o Romeiro | Ele derrete em faíscas cor de cera; o placar no canto de baixo à direita sobe até 30 | ☐ |
| 67 | **Morrer** | Tela escura, "A névoa te levou". Volta na frente do cruceiro, tudo cheio, cera 0 | ☐ |
| 68 | **A vela**: volte onde morreu | Uma vela acesa no chão com um facho de luz fraco (dá para ver de longe) e um zumbido baixo perto. "E · Pegar a cera (30)" | ☐ |
| 69 | **Morrer duas vezes**: morra com cera e, antes de pegar a vela, morra de novo | "A vela apagou: … de cera perdida" | ☐ |
| 70 | **Fechar e abrir**: feche a aba e abra o jogo de novo (sem `?novo`) | "Continuando de onde parou": na frente do cruceiro, com a cera e a vela onde estavam | ☐ |

> A partir do S9 o jogo abre no **vale** (Val de Santa Baia). Os itens 1–70 continuam valendo na arena: abra com `?arena` no fim do endereço.

| # | Teste (S9, o vale) | O que você deve ver | ✓ |
|---|---|---|---|
| 71 | **Abrir** com `?novo` | Você ao sul de um rio, com uma ponte de pedra ao norte e um brilho no chão perto de uma pedra | ☐ |
| 72 | **Achado**: chegue no brilho e aperte E | Um papel com a inscrição (dicas de controle). Some sozinho | ☐ |
| 73 | **Rio**: tente entrar na água fora da ponte | Na beira dá pé; mais para o meio, ele não entra | ☐ |
| 74 | **Ponte** | Dois romeiros do outro lado (um de costas). O cruceiro da ponte logo à direita: descanse nele ("Vela acesa") | ☐ |
| 75 | **Rua de baixo** (a oeste do prado) | Três romeiros ajoelhados em volta de uma fogueira; levantam quando te veem. Pão perto do poço | ☐ |
| 76 | **Rua de cima** (pela ponta oeste) | Casas, um hórreo, dois romeiros; um bilhete na porta da casa grande (do ferreiro) | ☐ |
| 77 | **Adro**: siga para leste | Igreja, cemitério com covas, três romeiros, pão e uma lápide para ler | ☐ |
| 78 | **Mosteiro**: passagem estreita a leste do adro | Claustro com colunas, quatro romeiros, uma fonte no meio, dois papéis para ler | ☐ |
| 79 | **Corredor**: do prado do cruceiro, entre pelo corredor de muros a leste e suba | No fim, um portão de madeira: "Fechado. Não abre deste lado." | ☐ |
| 80 | **Atalho**: dentro do mosteiro, ache a alavanca junto ao portão sul e aperte E | "Atalho aberto", o portão abre. Descendo o corredor você sai no prado do cruceiro da ponte | ☐ |
| 81 | **Morrer depois do atalho** | O portão continua aberto (fica salvo) | ☐ |
| 82 | **Subida e castro**: pelo portão norte do mosteiro | Subida com dois romeiros, o cruceiro do castro e uma parede de névoa: "A névoa fecha a entrada do castro… por enquanto" | ☐ |
| 83 | **Souto**: a oeste da subida | Bosque de castanheiros com uma clareira vazia (o Lobishome chega no S10) | ☐ |
| 84 | **FPS no vale** | Anote o FPS andando pela vila e no mosteiro | ☐ |
| 85 | **Trasno** (S10, rua de cima, perto do hórreo) | Pequeno, de gorro vermelho. Agacha dando uma risadinha e salta em você | ☐ |
| 86 | **Trasno rouba**: deixe ele acertar com cera no bolso | "Um trasno roubou … de cera!" e ele foge correndo. Alcance e mate: "A cera roubada voltou". Descansando antes, a cera some | ☐ |
| 87 | **Trasno erra**: role para o lado no salto | Ele cai de cara no chão e fica um instante parado (bata!) | ☐ |
| 88 | **Fondeiro** (ponta oeste da rua de cima; escada da igreja; alto da subida) | Gira a funda com um zunido que sobe e atira uma pedra | ☐ |
| 89 | **Pedra no escudo**: segure o escudo de frente | Baque de madeira, a vida não desce. Sem escudo: dói. Rolando: passa | ☐ |
| 90 | **Fondeiro de perto** | Chuta e foge. Depois do chute dá para bater | ☐ |
| 91 | **Lobishome** (clareira do souto, a oeste da subida) | Grande, peludo, cabeça de lobo. Rosna ao te ver | ☐ |
| 92 | **Zarpaço**: perto dele | Puxa os braços para trás (rosnado) e dá duas garradas | ☐ |
| 93 | **Salto**: fique a meia distância | Agacha e salta longe. Pegou: você cai no chão e levanta (sem levar outro golpe enquanto levanta) | ☐ |
| 94 | **Uivo**: bata nele até tirar um quarto da vida | Para e uiva alto: aparecem 2 trasnos numa fumacinha. Bata enquanto ele uiva | ☐ |
| 95 | **Vencer o Lobishome** | 400 de cera. Descansando ou morrendo, ele **não** volta (nem fechando a página) | ☐ |
| 96 | **Atalho 1**: na rua de cima, no vão entre a casa do ferreiro (2 andares) e a vizinha, ache o portão no muro | "Tirar a tranca do portão": abre e dá direto na rua de baixo (perto da fogueira). Do lado da rua de baixo: "Não abre deste lado" | ☐ |
| 97 | **Anaco de cabaça**: suba a escada da casa do ferreiro | Um brilho num móvel lá em cima: "Anaco de cabaça" — a cabaça passa a ter 5 goles | ☐ |
| 98 | **Atalho 3**: no souto, junto ao muro sul (perto do hórreo) | "Baixar a escada do hórreo": abre a passagem para a rua de cima. De baixo: "Alto demais. Não dá para subir daqui." | ☐ |
| 99 | **Chefe (S11), atalho de teste**: abra o jogo com `?castro` no fim do endereço | "Teste do chefe": você está na frente da névoa do castro. Esse atalho tem save próprio (o seu save de verdade não muda) | ☐ |
| 100 | **Atravessar a névoa**: E (ou A) | Você entra no castro; atrás de você a abertura fecha com névoa. Música de gaita e bombo. Barra grande embaixo: "A Serpe" | ☐ |
| 101 | **Bote**: a serpe ergue a cabeça e sibila | Role para o lado no fim do sibilo. Depois do bote a cabeça fica no chão um instante: bata nela (dói mais) | ☐ |
| 102 | **Rabada**: o rabo levanta e chocalha | Role para longe, ou fique colado na cabeça dela (perto não pega) | ☐ |
| 103 | **Enroscar**: fique colado no corpo dela uns segundos | Poeira levanta do corpo: saia rolando antes de ela apertar | ☐ |
| 104 | **Aparar o bote** (Shift+direito / LT na hora da mordida) | "Tlin", a postura dourada sobe um quarto. Cheia: a cabeça cai no chão 3 s — golpe leve perto da cabeça = crítico | ☐ |
| 105 | **Troca de fase**: tire toda a vida da serpe | Ela vira pedra (estalo, tremor), a música acelera (zanfona e alaúde) e a Moura dourada sai: "A Moura" | ☐ |
| 106 | **Fuso**: a Moura gira o fuso | Três estocadas seguidas: segure o escudo ou role para trás. A última dá para aparar | ☐ |
| 107 | **Fio de ouro**: ela ergue os braços, linhas douradas no chão | Saia de cima da linha do meio (fique entre duas linhas ou role para o lado) antes de elas subirem | ☐ |
| 108 | **Encanto**: ela some numa fumaça dourada | Um brilho com sinos aparece atrás de você: é onde ela volta. Role para longe dele | ☐ |
| 109 | **Morrer no chefe** | Volta no ✝ do Castro; a música para; a serpe dorme de novo, com a vida cheia | ☐ |
| 110 | **Vencer** | "A névoa se abre — Fim da demo" e um acorde no fim da música. A névoa da entrada some e dá para sair andando. No jogo de verdade (sem `?castro`), vencido ele não volta, nem fechando a página | ☐ |
| 111 | **FPS no chefe** | Anote o FPS na luta (a serpe tem 18 gomos) | ☐ |
## Anotar o FPS
O FPS aparece em verde no canto de cima, à direita. Anote depois de 1 minuto andando pela arena.

| Data | PR | FPS | Observação |
|---|---|---|---|
| | | | |

Se o FPS cair mais de 10% em relação ao PR anterior, avise a IA antes de aprovar o PR.
