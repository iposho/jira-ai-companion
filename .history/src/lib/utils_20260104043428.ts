import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function pluralize(count: number, words: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    const index =
        count % 100 > 4 && count % 100 < 20
            ? 2
            : cases[count % 10 < 5 ? count % 10 : 5];
    return words[index];
}
