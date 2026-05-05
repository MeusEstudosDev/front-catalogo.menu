import { NextRequest, NextResponse } from "next/server";

type TibiaDataCharacterResponse = {
  character?: {
    character?: {
      guild?: Record<string, unknown>;
      houses?: Array<Record<string, unknown>>;
    };
  };
  information?: {
    status?: {
      http_code?: number;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const encodedName = encodeURIComponent(name.trim());
    const url = `https://api.tibiadata.com/v4/character/${encodedName}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro ao consultar TibiaData (${response.status})`);
    }

    const data = (await response.json()) as TibiaDataCharacterResponse;
    const character = data.character?.character;
    const hasGuild = Boolean(character?.guild && Object.keys(character.guild).length > 0);
    const hasHouse = Boolean(character?.houses && character.houses.length > 0);

    if (data.information?.status?.http_code && data.information.status.http_code !== 200) {
      throw new Error(`TibiaData retornou status ${data.information.status.http_code}`);
    }

    return NextResponse.json({
      name: name.trim(),
      hasGuild: hasGuild || hasHouse,
      hasHouse,
      hasGuildOnly: hasGuild,
    });
  } catch (error) {
    console.error("Erro ao verificar personagem:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar personagem",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}