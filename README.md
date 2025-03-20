# NaturalPS - Gemini 2 Pro Image Generator

A web application for generating and modifying images using Google's Gemini 2 Pro API. Upload images, provide descriptions, and let AI create customized images.

## Features

- Upload up to 3 reference images
- Generate images based on textual descriptions
- Get both image and text responses from the AI
- Easy to use interface with image previews
- Error handling with automatic retry options

## Setup

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm
- Google API key with access to Gemini 2 Pro

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/naturalps.git
   cd naturalps
   ```

2. Install dependencies
   ```bash
   pnpm install
   # or npm install
   ```

3. Setup environment variables
   Copy the example environment file and modify it with your credentials:
   ```bash
   cp .env-example .env
   ```
   Then edit the `.env` file with your Google API key

4. Start the development server
   ```bash
   pnpm dev
   # or npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

The application requires the following environment variables:

| Variable | Description |
| --- | --- |
| `GOOGLE_API_KEY` | Your Google API key for Gemini 2 Pro |

## Usage

1. Enter a description for the image you want to generate
2. Optionally upload up to 3 reference images
3. Click "Generate Image"
4. View the AI's text response and generated image

## License

[MIT License](LICENSE)

## Acknowledgements

- Next.js
- Tailwind CSS
- Google Gemini 2 Pro
