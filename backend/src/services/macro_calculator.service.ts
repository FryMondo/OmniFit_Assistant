export interface MacroResults {
    target_calories: number;
    target_protein: number;
    target_fat: number;
    target_carbs: number;
}

export function calculateAge(dobString: string): number {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function calculateTargetMacros(
    gender: 'male' | 'female',
    dob: string,
    weightKg: number,
    heightCm: number,
    activity: number,
    goal: 'lose' | 'maintain' | 'gain'
): MacroResults {
    const age = calculateAge(dob);

    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const tdee = bmr * activity;

    let targetCalories = tdee;
    if (goal === 'lose') targetCalories -= tdee * 0.20;
    if (goal === 'gain') targetCalories += tdee * 0.15;

    let pPercent = 0.25;
    let fPercent = 0.30;
    let cPercent = 0.45;

    if (goal === 'lose') {
        pPercent = 0.30;
        fPercent = 0.30;
        cPercent = 0.40;
    } else if (goal === 'gain') {
        pPercent = 0.20;
        fPercent = 0.25;
        cPercent = 0.55;
    }

    const protein = (targetCalories * pPercent) / 4;
    const fat = (targetCalories * fPercent) / 9;
    const carbs = (targetCalories * cPercent) / 4;

    return {
        target_calories: Math.round(targetCalories),
        target_protein: Math.round(protein),
        target_fat: Math.round(fat),
        target_carbs: Math.round(carbs)
    };
}