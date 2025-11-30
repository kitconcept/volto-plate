describe('Basic Plate in Volto Test', () => {
  beforeEach(() => {
    cy.intercept('GET', '/**/Document').as('schema');

    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'page',
      contentTitle: 'A page',
    });
    cy.visit('/');
  });

  it('should visit the edit URL and interact with the editor, toolbar is shown', () => {
    cy.navigate('/page/edit');
    cy.url().should('eq', Cypress.config().baseUrl + '/page/edit');
    cy.wait('@schema');

    cy.get('.slate-editor').should('exist').click();
    cy.get(
      '.slate-editor[contenteditable="true"] [data-slate-node="element"]',
    ).type('This is the body text{enter}');
    // cy.getPlateEditor();

    cy.plateSetSelection({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    }); // or pass { editable: '.some-editor' } if multiple

    cy.get('[role="toolbar"]').should('be.visible');
  });

  it('should be able to split the current Plate block in two', () => {
    cy.navigate('/page/edit');
    cy.url().should('eq', Cypress.config().baseUrl + '/page/edit');
    cy.wait('@schema');

    cy.plateTypeAtPath(
      [0, 0],
      'This is the first line{enter}{enter}This is the second line',
    );

    cy.plateTypeAtPath([1, 0], '/split{enter}');

    cy.get('.slate-editor[contenteditable="true"] [data-slate-node="element"]')
      .should('have.length', 2)
      .eq(1)
      .should('have.text', 'This is the second line');
  });

  it('should be able to create a Volto block via slash command', () => {
    cy.navigate('/page/edit');
    cy.url().should('eq', Cypress.config().baseUrl + '/page/edit');
    cy.wait('@schema');

    cy.plateTypeAtPath([0, 0], '/teaser{enter}');

    cy.get(
      '.slate-editor[contenteditable="true"] [data-slate-node="element"]',
    ).should('have.length', 1);

    cy.get('#sidebar-properties header h2')
      .should('exist')
      .should('have.text', 'Teaser');
  });
});
