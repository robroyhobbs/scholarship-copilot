import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string = "Bad request") {
  return apiError(message, 400);
}

export function unauthorized(message: string = "Unauthorized") {
  return apiError(message, 401);
}

export function forbidden(message: string = "Forbidden") {
  return apiError(message, 403);
}

export function notFound(message: string = "Not found") {
  return apiError(message, 404);
}

export function tooManyRequests(
  message: string = "Too many requests",
  retryAfterSeconds?: number,
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: retryAfterSeconds
        ? {
            "Retry-After": String(retryAfterSeconds),
          }
        : undefined,
    },
  );
}
