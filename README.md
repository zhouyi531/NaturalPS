# NaturalPS - Gemini 2 Pro Image Generator

A web application for generating and modifying images using Google's Gemini 2 Pro API. Upload images, provide descriptions, and let AI create customized images.

![Effect Examples](/public/example/effect.jpg)

![UI](/public/example/UI_1.jpg)

## 使用自然语言进行图像处理 | Image Editing with Natural Language

### 中文
使用Gemini-2-flash的最大优势是能够用自然语言描述你想要的图像编辑效果。无需学习复杂的PS工具和操作，只需简单描述即可实现专业级的图像处理效果。例如：

- 把这张图里的人物扩展到全身
- 把两张图里的人物做一个合影，背景是北海蓝天
- 保留人物面部特征，换到星球大战的场景
- 给人物换一件黄色的衣服
- 添加一个微笑的表情
- 将照片风格转换为油画

### English
The biggest advantage of using Gemini-2-flash is the ability to describe image editing effects in natural language. Instead of learning complex Photoshop tools and operations, you can achieve professional-level image processing with simple descriptions. For example:

- Extend this character in the image to full body
- Create a group photo of people from two images with the blue sky of Beihai as background
- Keep the facial features of the character and place them in a Star Wars scene
- Change the character's clothes to yellow
- Add a smiling expression
- Convert the photo style to oil painting

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
   git clone https://github.com/zhouyi531/NaturalPS.git
   cd NaturalPS
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
