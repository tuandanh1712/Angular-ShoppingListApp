import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { Recipe } from './recipe.model';
import { DataStorageService } from '../shared/data-storage.service';
import { RecipeService } from './recipe.service';
import { Actions, ofType } from '@ngrx/effects';
import * as RecipesActions from '../recipes/store/recipe.actions';
import * as fromApp from '../../app/store/app.reducer';

import { Store } from '@ngrx/store';
import { take } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class RecipesResolverService implements Resolve<Recipe[]> {
  constructor(
    private store: Store<fromApp.AppState>,
    private actions$: Actions
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.store.dispatch(new RecipesActions.FetchRecipes());
    return this.actions$.pipe(ofType(RecipesActions.SET_RECIPES), take(1));
  }
}
