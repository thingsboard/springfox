import tbComponentsPlugin from "./tb-components";
import httpLoginAuthPlugin from "./http-login-auth";
import csrfSupport from './csrf';

window.onload = () => {

  const buildSystemAsync = async (baseUrl) => {
    try {
      console.log(baseUrl);
      const configUIResponse = await fetch(
          baseUrl + "/swagger-resources/configuration/ui",
          {
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
      const configUI = await configUIResponse.json();

      const configSecurityResponse = await fetch(
          baseUrl + "/swagger-resources/configuration/security",
          {
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
      const configSecurity = await configSecurityResponse.json();

      const resourcesResponse = await fetch(
          baseUrl + "/swagger-resources",
          {
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
      const resources = await resourcesResponse.json();
      window.ui = getUI(baseUrl, prependBaseUrl(baseUrl.replace(configUI.swaggerBaseUiUrl, ""), resources), configUI, configSecurity);
      window.uiConfig = configUI;
      window.securityConfig = configSecurity;
    } catch (e) {
      const retryURL = await prompt(
        "Unable to infer base url. This is common when using dynamic servlet registration or when" +
        " the API is behind an API Gateway. The base url is the root of where" +
        " all the swagger resources are served. For e.g. if the api is available at http://example.org/api/v2/api-docs" +
        " then the base url is http://example.org/api/. Please enter the location manually: ",
        window.location.href);

      return buildSystemAsync(retryURL);
    }
  };

  const prependBaseUrl = (baseUrl, resources) => {
    resources.forEach(function(r) {
      r.url = baseUrl + r.url;
    })
    return resources;
  };

  const getUI = (baseUrl, resources, configUI, configSecurity) => {
    const ui = SwaggerUIBundle({
      /*--------------------------------------------*\
       * Core
      \*--------------------------------------------*/
      configUrl: null,
      dom_id: "#swagger-ui",
      dom_node: null,
      spec: {},
      url: "",
      urls: resources,
      /*--------------------------------------------*\
       * Plugin system
      \*--------------------------------------------*/
      layout: "StandaloneLayout",
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl,
        tbComponentsPlugin,
        httpLoginAuthPlugin
      ],
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      /*--------------------------------------------*\
       * Auth
      \*--------------------------------------------*/
      persistAuthorization: configUI.persistAuthorization,
      /*--------------------------------------------*\
       * Display
      \*--------------------------------------------*/
      deepLinking: configUI.deepLinking,
      displayOperationId: configUI.displayOperationId,
      defaultModelsExpandDepth: configUI.defaultModelsExpandDepth,
      defaultModelExpandDepth: configUI.defaultModelExpandDepth,
      defaultModelRendering: configUI.defaultModelRendering,
      displayRequestDuration: configUI.displayRequestDuration,
      docExpansion: configUI.docExpansion,
      filter: configUI.filter,
      maxDisplayedTags: configUI.maxDisplayedTags,
      operationsSorter: configUI.operationsSorter,
      showExtensions: configUI.showExtensions,
      showCommonExtensions: configUI.showCommonExtensions,
      syntaxHighlight: configUI.syntaxHighlightActivate ? {
        activate: true,
        theme: configUI.syntaxHighlightTheme
      } : false,
      /*--------------------------------------------*\
       * Network
      \*--------------------------------------------*/
      oauth2RedirectUrl: baseUrl + "/swagger-ui/oauth2-redirect.html",
      requestInterceptor: (a => a),
      responseInterceptor: (a => a),
      showMutatedRequest: true,
      supportedSubmitMethods: configUI.supportedSubmitMethods,
      validatorUrl: configUI.validatorUrl,
      /*--------------------------------------------*\
       * Macros
      \*--------------------------------------------*/
      modelPropertyMacro: null,
      parameterMacro: null,
      /*--------------------------------------------*\
       * Custom configs
      \*--------------------------------------------*/
      custom: {
        enableCsrfSupport: configSecurity.enableCsrfSupport,
      },
    });

    ui.initOAuth({
      /*--------------------------------------------*\
       * OAuth
      \*--------------------------------------------*/
      clientId: configSecurity.clientId,
      clientSecret: configSecurity.clientSecret,
      realm: configSecurity.realm,
      appName: configSecurity.appName,
      scopeSeparator: configSecurity.scopeSeparator,
      additionalQueryStringParams: configSecurity.additionalQueryStringParams,
      useBasicAuthenticationWithAccessCodeGrant: configSecurity.useBasicAuthenticationWithAccessCodeGrant,
    });

    return ui;
  };

  const getBaseURL = () => {
    const urlMatches = /(.*)\/swagger-ui(\/index.html.*)*/.exec(window.location.href);
    return urlMatches[1];
  };

  /* Entry Point */
  (async () => {
    const baseURL = getBaseURL();
    await buildSystemAsync(baseURL);
    const springBaseUrl = baseURL.replace(window.uiConfig.swaggerBaseUiUrl, "");
    if (window.ui.getConfigs().custom.enableCsrfSupport) {
      await csrfSupport(springBaseUrl);
    }
  })();

};
