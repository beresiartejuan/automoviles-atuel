// Respond with JSON data
export function respondWithJson(data: { [key: string]: string }, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

// Respond with a plain text message
export function respondWithText(message: string, status = 200) {
    return new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}

// Respond with an error message
export function respondWithError(message = 'Something went wrong', status = 500) {
    return respondWithJson({ error: message }, status);
}

// Respond with a custom response
export function customResponse(body: any, status = 200) {
    return new Response(body, {
        status,
    });
}
