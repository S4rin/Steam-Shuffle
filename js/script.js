
const botao = document.querySelector("#botao-sortear");
const botaoNovamente = document.querySelector("#sortearNovamente");
const campoSteamId = document.querySelector("#steamId");

const resultado = document.querySelector("#resultado");
const capa = document.querySelector("#capa-jogo");
const nomeJogo = document.querySelector("#nome-jogo");
const linkJogo = document.querySelector("#link-jogo");
const mensagem = document.querySelector("#mensagem");

let jogos = [];

botao.addEventListener("click", carregarJogos);
botaoNovamente.addEventListener("click", sortearJogo);

async function carregarJogos() {
    const steamId = campoSteamId.value.trim();

    if (!/^\d{17}$/.test(steamId)) {
        mensagem.textContent = "Digite um Steam ID64 válido.";
        return;
    }

    botao.disabled = true;
    resultado.hidden = true;
    mensagem.textContent = "Buscando sua biblioteca Steam...";

    try {
        const resposta = await fetch(
            `/.netlify/functions/jogos?steamId=${encodeURIComponent(steamId)}`
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

        mensagem.textContent = `${jogos.length} jogos encontrados!`;
        sortearJogo();

    } catch (erro) {
        mensagem.textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
}

function sortearJogo() {
    if (jogos.length === 0) {
        mensagem.textContent = "Busque uma biblioteca primeiro.";
        return;
    }

    const indice = Math.floor(Math.random() * jogos.length);
    const jogo = jogos[indice];

    nomeJogo.textContent = jogo.name || `Jogo ${jogo.appid}`;

    capa.src =
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${jogo.appid}/header.jpg`;

    capa.alt = `Capa de ${nomeJogo.textContent}`;

    linkJogo.href =
        `https://store.steampowered.com/app/${jogo.appid}/`;

    resultado.hidden = false;
    mensagem.textContent = "Jogo sorteado!";
}
