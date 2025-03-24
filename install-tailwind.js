// install-tailwind.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the correct dependencies are installed
try {
  console.log('Installing Tailwind CSS dependencies...');
  execSync('npm install tailwindcss@3.3.3 postcss@8.4.28 autoprefixer@10.4.15 --save-dev', { stdio: 'inherit' });
  console.log('Tailwind CSS dependencies installed successfully!');
} catch (error) {
  console.error('Error installing Tailwind CSS dependencies:', error);
  process.exit(1);
}

// Check if the postcss.config.js exists
const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
if (!fs.existsSync(postcssConfigPath)) {
  console.log('Creating postcss.config.js...');
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  fs.writeFileSync(postcssConfigPath, postcssConfig);
  console.log('postcss.config.js created successfully!');
}

// Check if the tailwind.config.js exists
const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
if (!fs.existsSync(tailwindConfigPath)) {
  console.log('Creating tailwind.config.js...');
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  fs.writeFileSync(tailwindConfigPath, tailwindConfig);
  console.log('tailwind.config.js created successfully!');
}

console.log('Tailwind CSS setup complete!');