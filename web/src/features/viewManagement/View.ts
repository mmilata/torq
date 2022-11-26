import clone from "clone";
import { ColumnMetaData } from "features/table/types";
import { AndClause, Clause } from "../sidebar/sections/filter/filter";
import { OrderBy } from "../sidebar/sections/sort/SortSection";
import { ViewInterface } from "./types";

export default class View<T> {
  view: ViewInterface<T>;
  renderCallback: React.Dispatch<React.SetStateAction<number>>;
  renderCount = 0;

  constructor(view: ViewInterface<T>, renderCount: number, render: React.Dispatch<React.SetStateAction<number>>) {
    this.view = view;
    this.renderCallback = render;
    this.renderCount = renderCount;
  }

  get columns(): ColumnMetaData<T>[] {
    return this.view.columns;
  }

  get sortBy(): OrderBy[] | undefined {
    return this.view.sortBy;
  }

  get filters(): Clause | AndClause | undefined {
    return this.view.filters;
  }

  //------------------ Columns ------------------

  getLocedColumns(): ColumnMetaData<T>[] {
    return this.view.columns.filter((column) => column.locked === true);
  }

  getMovableColumns(): ColumnMetaData<T>[] {
    return this.view.columns.filter((column) => column.locked !== true);
  }

  getColumn = (index: number): ColumnMetaData<T> => {
    return this.view.columns[index];
  };

  addColumn = (column: ColumnMetaData<T>) => {
    this.view.columns.push(column);
    this.render();
  };

  updateColumn = (column: ColumnMetaData<T>, index: number) => {
    this.view.columns[index] = column;
    this.render();
  };

  updateAllColumns = (columns: Array<ColumnMetaData<T>>) => {
    this.view.columns = columns;
    this.render();
  };

  moveColumn = (fromIndex: number, toIndex: number) => {
    const column = this.view.columns[fromIndex];
    this.view.columns.splice(fromIndex, 1);
    this.view.columns.splice(toIndex, 0, column);
    this.render();
  };

  removeColumn = (index: number) => {
    this.view.columns.splice(index, 1);
    this.render();
  };

  //------------------ SortBy ------------------

  addSortBy = (sortBy: OrderBy) => {
    this.view.sortBy = this.view.sortBy || [];
    this.view.sortBy = [...this.view.sortBy, sortBy];

    this.render();
  };

  updateSortBy = (update: OrderBy, index: number) => {
    if (this.view?.sortBy) {
      this.view.sortBy = [
        ...this.view.sortBy.slice(0, index),
        update,
        ...this.view.sortBy.slice(index + 1, this.view.sortBy.length),
      ];
    }

    this.render();
  };

  updateAllSortBy = (sortBy: Array<OrderBy>) => {
    this.view.sortBy = sortBy;

    this.render();
  };

  moveSortBy = (fromIndex: number, toIndex: number) => {
    if (this.view.sortBy) {
      const sortBy = clone(this.view.sortBy);
      const item = sortBy[fromIndex];
      sortBy.splice(fromIndex, 1);
      sortBy.splice(toIndex, 0, item);
      this.view.sortBy = sortBy;
    }
  };

  removeSortBy = (index: number) => {
    this.view.sortBy = this.view.sortBy || [];
    this.view.sortBy = [
      ...this.view.sortBy.slice(0, index),
      ...this.view.sortBy.slice(index + 1, this.view.sortBy.length),
    ];

    this.render();
  };

  //------------------ Filters ------------------
  // Filters are handled in the filters component. It can be refactored later, but for now it is fine.

  updateFilters = (filters: Clause) => {
    this.view.filters = filters;

    this.render();
  };

  //------------------ Render ------------------
  // This is a callback from the parent component to make react render. Used when the view is updated.
  private render() {
    this.renderCallback(this.renderCount + 1);
  }
}
