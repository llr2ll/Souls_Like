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
| 45 | **Morrer** | "A névoa te levou". Em 3,5 s você volta ao começo com tudo cheio e o Romeiro volta para o lugar dele | ☐ |
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
## Anotar o FPS
O FPS aparece em verde no canto de cima, à direita. Anote depois de 1 minuto andando pela arena.

| Data | PR | FPS | Observação |
|---|---|---|---|
| | | | |

Se o FPS cair mais de 10% em relação ao PR anterior, avise a IA antes de aprovar o PR.
