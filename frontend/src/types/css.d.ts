// CSS Modules for CSS files in the frontend directory.
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// CSS Modules for SCSS files in the frontend directory.
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
} 