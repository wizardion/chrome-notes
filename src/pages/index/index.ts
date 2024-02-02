import './assets/colors.scss';
import 'styles/body.scss';


import('./init').then(({ init, whenDefined }) => whenDefined().then(() => init()));

// document.body.classList.remove('theme-dark');

// if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//   // dark mode
//   console.log('dark mode');
// } else {
//   console.log('light mode');
// }

// window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
//   const newColorScheme = event.matches ? 'dark' : 'light';

//   console.log('mode', [newColorScheme]);
// });
