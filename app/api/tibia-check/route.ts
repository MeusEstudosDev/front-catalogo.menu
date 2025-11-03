import axios from "axios";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Fazer requisição para o site do Tibia
    const encodedName = encodeURIComponent(name.trim());
    const url = `https://www.tibia.com/community/?subtopic=characters&name=${encodedName}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Carregar HTML com Cheerio
    const $ = cheerio.load(response.data);

    // Procurar pelo texto "Guild Membership:" ou "Guild&nbsp;Membership:"
    const bodyText = $("body").html() || "";
    const hasGuild =
      bodyText.includes("Guild Membership:") ||
      bodyText.includes("Guild&nbsp;Membership:");

    return NextResponse.json({
      name: name.trim(),
      hasGuild,
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
