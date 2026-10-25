
async function resolverSteamId(entrada, apiKey) {
    const valor = entrada.trim();

    // 1. O usuário informou diretamente o Steam ID64
    if (/^\d{17}$/.test(valor)) {
        return valor;
    }

    let url;

    try {
        // Aceita links com ou sem https://
        url = new URL(
            /^[a-z][a-z\d+.-]*:\/\//i.test(valor)
                ? valor
                : `https://${valor}`
        );
    } catch {
        throw new Error("Digite um Steam ID64 ou link válido.");
    }

    // Aceita apenas o domínio oficial da comunidade Steam
    if (
        !["steamcommunity.com", "www.steamcommunity.com"]
            .includes(url.hostname.toLowerCase()) ||
        !["https:", "http:"].includes(url.protocol)
    ) {
        throw new Error("O link precisa ser de um perfil da Steam.");
    }

    const partes = url.pathname.split("/").filter(Boolean);

    // 2. Perfil com Steam ID64 na URL
    if (
        partes[0] === "profiles" &&
        /^\d{17}$/.test(partes[1] || "")
    ) {
        return partes[1];
    }

    // 3. Perfil com nome personalizado
    if (partes[0] === "id" && partes[1]) {
        const resolveUrl = new URL(
            "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/"
        );

        resolveUrl.searchParams.set("key", apiKey);
        resolveUrl.searchParams.set("vanityurl", partes[1]);

        const resposta = await fetch(resolveUrl);

        if (!resposta.ok) {
            throw new Error("Erro ao consultar o perfil na Steam.");
        }

        const dados = await resposta.json();

        if (dados.response?.success !== 1) {
            throw new Error(
                "Perfil Steam não encontrado. Verifique o link."
            );
        }

        return dados.response.steamid;
    }

    throw new Error(
        "Link não reconhecido. Use /profiles/ID64 ou /id/usuario."
    );
}

export default async (request) => {
    const entrada = new URL(request.url)
        .searchParams.get("steamId");

    if (!entrada) {
        return Response.json(
            { error: "Informe o Steam ID64 ou link do perfil." },
            { status: 400 }
        );
    }

    const apiKey = process.env.STEAM_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "Chave da Steam não configurada." },
            { status: 500 }
        );
    }

    try {
        // Converte o link para Steam ID64, se necessário
        const steamId = await resolverSteamId(entrada, apiKey);

        // Consulta os jogos da biblioteca
        const url = new URL(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
        );

        url.searchParams.set("key", apiKey);
        url.searchParams.set("steamid", steamId);
        url.searchParams.set("include_appinfo", "1");
        url.searchParams.set("include_played_free_games", "1");

        const resposta = await fetch(url);

        if (!resposta.ok) {
            return Response.json(
                { error: "Erro ao consultar a biblioteca da Steam." },
                { status: 502 }
            );
        }

        const dados = await resposta.json();

        if (!dados.response) {
            return Response.json(
                { error: "Resposta inválida da Steam." },
                { status: 502 }
            );
        }

        const games = (dados.response.games || []).map(jogo => ({
            appid: jogo.appid,
            name: jogo.name
        }));

        return Response.json({ games });

    } catch (erro) {
        return Response.json(
            { error: erro.message || "Não foi possível conectar à Steam." },
            { status: 400 }
        );
    }
};
