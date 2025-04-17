# Better Than 4 But Not 5

An LLM model sorting game.

Players are challenged to sort model names based on different criteria. The game seeks to demonstrate how difficult it can be to understand the relative positioning of models like "GPT-4.5", "GPT-4.1", "GPT-4o" etc. based on their names alone.

## Play Online

This game is hosted on GitHub Pages at: [https://wspittman.github.io/BetterThan4ButNot5](https://wspittman.github.io/BetterThan4ButNot5)

1. Choose a model set: Random 10, All Models, Anthropic, Google, OpenAI
2. Choose a sorting criterion (Release Date, Input Cost, or Arena Score)

- **Release Date**: Sort models from newest to oldest release (first day of API general availability)
- **Input Cost**: Sort models from cheapest to most expensive (at time of release)
- **Arena Score**: Sort models from highest to lowest performance (as of last pull on April 15, 2025)

3. Drag the model names into the correct order
4. Click "Check Order" to see if you got it right

## Running Locally

Simply clone this repository and open `index.html` in your web browser:

```
git clone https://github.com/wspittman/BetterThan4ButNot5.git
cd BetterThan4ButNot5
```

No build tools or server setup required.

## Contributing

This was a vibe-coding project, so the code is messy and I don't intend to put a ton of time into it.

Contributions, issues, and feature requests are still welcome. Especially for adding more model data or improving the UI.

If you disagree with the sorting criteria (eg. release date or cost on release for a specific model), please open an issue and cite a source for why the number I picked was wrong.

## Acknowledgments

- Inspired by the often confusing naming conventions in the AI industry
- The archives of [Simon Willison's Weblog](https://simonwillison.net/) and the history of his [LLM Prices](https://github.com/simonw/tools/commits/main/llm-prices.html) tool were invaluable for gathering release and cost data.
- LMArena Scores came from the [LMArena Leaderboard](https://lmarena.ai/?leaderboard), obvs.
