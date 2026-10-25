
export default async (request) => {
    const steamId = new URL(request.url)
        .searchParams.get("steamId");

    if (!steamId || !/^\d{17}$/.test(steamId)) {
        return Response.json(
            { error: "Steam ID64 inválido." },
            { status: 400 }
        );
    }

    const apiKey = Netlify.env.get("STEAM_API_KEY");

    if (!apiKey) {
        return Response.json(
            { error: "Chave da Steam não configurada." },
            { status: 500 }
        );
    }

    const url = new URL(
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
    );

    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("include_appinfo", "1");
    url.searchParams.set("include_played_free_games", "1");

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            console.error("Erro HTTP da Steam:", resposta.status);
        
            return Response.json(
                { error: `A Steam retornou HTTP ${resposta.status}.` },
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
    } catch {
        return Response.json(
            { error: "Não foi possível conectar à Steam." },
            { status: 502 }
        );
    }
};
