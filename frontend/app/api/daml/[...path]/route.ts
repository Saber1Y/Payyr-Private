import { NextRequest, NextResponse } from "next/server";

const defaultApiUrl =
  process.env.DAML_API_URL ||
  process.env.NEXT_PUBLIC_DAML_API_URL ||
  "http://127.0.0.1:7575";

const accessToken =
  process.env.DAML_ACCESS_TOKEN || process.env.NEXT_PUBLIC_DAML_ACCESS_TOKEN;

function buildTargetUrl(pathSegments: string[]): string {
  const baseUrl = defaultApiUrl.replace(/\/$/, "");
  return `${baseUrl}/${pathSegments.join("/")}`;
}

async function forwardRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const response = await fetch(buildTargetUrl(pathSegments), {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseText = await response.text();

  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}
