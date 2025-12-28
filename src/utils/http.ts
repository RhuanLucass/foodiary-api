import { HttpResponse } from "../types/Http";

export function ok(body?: Record<string, any>): HttpResponse {
  return {
    statusCode: 200,
    ...(body !== undefined && { body }),
  }
}

export function created(body?: Record<string, any>): HttpResponse {
  return {
    statusCode: 201,
    ...(body !== undefined && { body }),
  }
}

export function badRequest(body?: Record<string, any>): HttpResponse {
  return {
    statusCode: 400,
    ...(body !== undefined && { body }),
  }
}

export function conflict(body?: Record<string, any>): HttpResponse {
  return {
    statusCode: 409,
    ...(body !== undefined && { body }),
  }
}

export function unauthorized(body?: Record<string, any>): HttpResponse {
  return {
    statusCode: 401,
    ...(body !== undefined && { body }),
  }
}