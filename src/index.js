import App from './App';


// Create instance of App, initialize it and catch any exception that could occur during initialization
try {
    const app = new App();
    app.initInteraction().initGui().run();
} catch (exception) {
    console.warn(exception);
    alert('Exception during initialization, check console for further details');
}