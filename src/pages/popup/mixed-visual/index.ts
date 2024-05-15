import 'styles/body.scss';


import('./mixed-visual').then(({ init, whenDefined }) => whenDefined().then(() => init()));
