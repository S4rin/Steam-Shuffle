
const botao = document.querySelector("#botao-sortear");
const campoSteamId = document.querySelector("#steamId");

const resultado = document.querySelector("#resultado");
const capa = document.querySelector("#capa-jogo");
const nomeJogo = document.querySelector("#nome-jogo");
const linkJogo = document.querySelector("#link-jogo");
const mensagem = document.querySelector("#mensagem");

let jogos = [];


const somInicio = new Audio("/sounds/spin.mp3");
const somRoleta = new Audio("/sounds/tick.mp3");
const somVitoria = new Audio("/sounds/win.mp3");

somInicio.volume = 0.5;
somRoleta.volume = 0.4;
somVitoria.volume = 0.6;

function tocarSom(som) {
    som.currentTime = 0;

    som.play().catch(() => {
        // O navegador pode bloquear a reprodução do áudio.
    });
}


botao.addEventListener("click", carregarJogos);


async function carregarJogos() {

    botao.textContent = "Sortear";
    // Se já carregamos os jogos, apenas sorteia outro
    if (jogos.length > 0) {
        sortearJogo();
        return;
    }

    const entrada = campoSteamId.value.trim();

    if (!entrada) {
        mensagem.textContent =
            "Digite seu Steam ID64 ou link do perfil Steam.";
        return;
    }

    botao.disabled = true;
    resultado.hidden = true;
    mensagem.textContent = "Buscando sua biblioteca Steam...";

    try {
        const resposta = await fetch(
            `/.netlify/functions/jogos?steamId=${encodeURIComponent(entrada)}`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error || "Erro ao buscar a biblioteca."
            );
        }

        jogos = dados.games || [];

        if (jogos.length === 0) {
            mensagem.textContent =
                "Nenhum jogo encontrado. Verifique a privacidade da biblioteca.";
            return;
        }

        sortearJogo();

    } catch (erro) {
        mensagem.textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
}



let sorteioEmAndamento = false;

function sortearJogo() {
    if (jogos.length === 0) {
        mensagem.textContent = "Busque uma biblioteca primeiro.";
        return;
    }

    if (sorteioEmAndamento) return;

    let ultimoSom = -180;
    sorteioEmAndamento = true;
    tocarSom(somInicio);
    botao.disabled = true;
    resultado.hidden = false;

    resultado.classList.remove("vencedor");
    resultado.classList.add("animando");

    mensagem.textContent = "Sorteando seu próximo jogo...";

    // Escolhe antecipadamente o resultado final
    const jogoFinal = jogos[
        Math.floor(Math.random() * jogos.length)
    ];

    // Duração e velocidade da animação
    const duracao = 2500;
    const inicio = Date.now();
    let intervalo = 60;

    function mostrarJogo(jogo) {
        nomeJogo.textContent = jogo.name || `Jogo ${jogo.appid}`;

        capa.src =
            `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${jogo.appid}/header.jpg`;

        capa.alt = `Capa de ${nomeJogo.textContent}`;

        linkJogo.href =
            `https://store.steampowered.com/app/${jogo.appid}/`;
    }

    function animar() {
        const decorrido = Date.now() - inicio;

        if (decorrido >= duracao) {
            tocarSom(somVitoria);
            // Revela o jogo sorteado
            mostrarJogo(jogoFinal);

            resultado.classList.remove("animando");
            resultado.classList.remove("vencedor");

            // Reinicia a animação de vitória
            void resultado.offsetWidth;
            resultado.classList.add("vencedor");

            mensagem.textContent = "🎉 Seu jogo foi sorteado!";

            botao.textContent = "Sortear novamente";
            botao.disabled = false;
            sorteioEmAndamento = false;
            return;
        }

        // Mostra jogos aleatórios durante a roleta
        const jogoTemporario =
            jogos[Math.floor(Math.random() * jogos.length)];

        mostrarJogo(jogoTemporario);

        if (
            decorrido < duracao - 300 &&
            decorrido - ultimoSom >= 180
        ) {
            tocarSom(somRoleta);
            ultimoSom = decorrido;
        }

        // A roleta desacelera gradualmente
        const progresso = decorrido / duracao;
        intervalo = 60 + Math.pow(progresso, 3) * 350;

        setTimeout(animar, intervalo);
    }

    animar();
}

