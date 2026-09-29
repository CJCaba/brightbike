export type Phase =
    | { kind: 'countdown'; n: number }
    | { kind: 'playing' }
    | { kind: 'over'; winner: number | null };   // null = draw