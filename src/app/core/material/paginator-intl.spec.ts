import { portuguesePaginatorIntl } from './paginator-intl';

describe('portuguesePaginatorIntl', () => {
  describe('Dado o paginator em português', () => {
    it('Então define labels traduzidos', () => {
      // Arrange

      // Act
      const intl = portuguesePaginatorIntl();

      // Assert
      expect(intl.itemsPerPageLabel).toBe('Itens por página');
      expect(intl.nextPageLabel).toBe('Próxima página');
      expect(intl.previousPageLabel).toBe('Página anterior');
      expect(intl.firstPageLabel).toBe('Primeira página');
      expect(intl.lastPageLabel).toBe('Última página');
    });

    it('Então calcula range vazio quando não há itens ou page size', () => {
      // Arrange
      const intl = portuguesePaginatorIntl();

      // Act
      const empty = intl.getRangeLabel(0, 10, 0);
      const noPageSize = intl.getRangeLabel(0, 0, 10);

      // Assert
      expect(empty).toBe('0 de 0');
      expect(noPageSize).toBe('0 de 10');
    });

    it('Então calcula range limitado pelo total de itens', () => {
      // Arrange
      const intl = portuguesePaginatorIntl();

      // Act
      const label = intl.getRangeLabel(2, 10, 25);

      // Assert
      expect(label).toBe('21 - 25 de 25');
    });
  });
});
