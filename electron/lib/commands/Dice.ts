export const rollDice = async () => {
    const sides = 6;
    return `You rolled a ${Math.floor(Math.random() * sides) + 1}`;
};
