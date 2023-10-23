import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as RecipesActions from './recipe.actions';
import { map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../recipe.model';
import { Injectable } from '@angular/core';
@Injectable()
export class RecipeEffects {
  fectchRecipes = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipesActions.FETCH_RECIPES),
      switchMap(() => {
        return this.http.get<Recipe[]>(
          'https://ng-course-recipe-book-65f10.firebaseio.com/recipes.json'
        );
      }),
      map((recipes) => {
        return recipes.map((recipe) => {
          return {
            ...recipe,
            ingredients: recipe.ingredients ? recipe.ingredients : [],
          };
        });
      }),
      map((recipe) => {
        return new RecipesActions.SetRecipes(recipe);
      })
    )
  );
  constructor(private actions$: Actions, private http: HttpClient) {}
}
