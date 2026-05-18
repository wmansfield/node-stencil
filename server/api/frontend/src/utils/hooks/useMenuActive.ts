/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable  @typescript-eslint/no-explicit-any
import { useMemo } from 'react';
import { useLocation } from 'react-router';
import isPlainObject from 'lodash/isPlainObject';
import type { NavigationTree } from '@/@types/navigation';

interface NavInfo extends NavigationTree {
   parentKey?: string;
}

/**
 * Converts a route path pattern (e.g., "admin/blueprints/:id") to a regex pattern
 * that can match actual paths (e.g., "admin/blueprints/123")
 */
const pathPatternToRegex = (pattern: string): RegExp => {
   // Remove leading slash if present, then escape special regex characters
   const cleanPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern;
   // Replace :param with [^/]+ to match any non-slash characters
   const regexPattern = cleanPattern.replace(/:[^/]+/g, '[^/]+');
   // Match from start of path segment
   return new RegExp('^/' + regexPattern + '(?:/|$)');
};

/**
 * Checks if a location path matches a navigation tree path pattern
 * For exact matches, requires exact equality (not just prefix)
 */
const matchesPath = (locationPath: string, navPath: string): boolean => {
   if (!navPath) return false;
   // Exact match
   if (locationPath === navPath) return true;
   // Pattern match (for routes with parameters like :id)
   const regex = pathPatternToRegex(navPath);
   return regex.test(locationPath);
};

/**
 * Finds a navigation item by matching the location path against navigation paths
 * Checks subMenus first to find more specific matches before checking parent items
 * Prefers exact matches over pattern matches, and longer paths over shorter ones
 */
const findNavByPath = (navTree: NavigationTree[], locationPath: string, parentKey?: string): NavInfo | undefined => {
   let bestMatch: NavInfo | undefined;
   let bestMatchLength = 0;
   let bestIsExact = false;

   const normalizedLocationPath = locationPath.startsWith('/') ? locationPath : '/' + locationPath;

   for (const nav of navTree) {
      // Check subMenu first (more specific matches are usually in subMenus)
      if (nav.subMenu && nav.subMenu.length > 0) {
         const found = findNavByPath(nav.subMenu, locationPath, nav.key);
         if (found && found.path) {
            const foundPath = found.path.startsWith('/') ? found.path : '/' + found.path;
            const isExact = normalizedLocationPath === foundPath;
            // Prefer exact matches, or longer paths if both are pattern matches
            const isBetter = isExact || (!bestIsExact && foundPath.length > bestMatchLength);
            if (isBetter) {
               bestMatch = found;
               bestMatchLength = foundPath.length;
               bestIsExact = isExact;
            }
         }
      }

      // Then check if current nav matches
      if (nav.path) {
         const navPath = nav.path.startsWith('/') ? nav.path : '/' + nav.path;
         const isExact = normalizedLocationPath === navPath;
         const isPatternMatch = !isExact && matchesPath(locationPath, nav.path);

         if (isExact || isPatternMatch) {
            // Prefer exact matches, or longer paths if both are pattern matches
            const isBetter = isExact || (!bestIsExact && navPath.length > bestMatchLength);
            if (isBetter) {
               const result: NavInfo = { ...nav };
               if (parentKey) {
                  result.parentKey = parentKey;
               }
               bestMatch = result;
               bestMatchLength = navPath.length;
               bestIsExact = isExact;
            }
         }
      }
   }

   return bestMatch;
};

/**
 * Finds the best matching parent navigation item when a nested route is active
 * Returns the parent nav if the location path starts with the parent path
 * Prefers the longest (most specific) matching path
 */
const findParentNavByPath = (navTree: NavigationTree[], locationPath: string, parentKey?: string): NavInfo | undefined => {
   let bestMatch: NavInfo | undefined;
   let bestMatchLength = 0;

   // Normalize location path once
   const normalizedLocationPath = locationPath.startsWith('/') ? locationPath : '/' + locationPath;

   for (const nav of navTree) {
      if (nav.path) {
         // Normalize nav path for comparison
         const normalizedNavPath = nav.path.startsWith('/') ? nav.path : '/' + nav.path;

         // Check if location path starts with nav path (exact prefix match)
         // Match if: location === nav OR location starts with nav + '/'
         const isMatch = normalizedLocationPath === normalizedNavPath || normalizedLocationPath.startsWith(normalizedNavPath + '/');

         if (isMatch && normalizedNavPath.length > bestMatchLength) {
            // This is a better (longer/more specific) match
            bestMatch = { ...nav };
            if (parentKey) {
               bestMatch.parentKey = parentKey;
            }
            bestMatchLength = normalizedNavPath.length;
         }
      }

      // Check subMenu recursively - this will find more specific matches
      if (nav.subMenu && nav.subMenu.length > 0) {
         const subMatch = findParentNavByPath(nav.subMenu, locationPath, nav.key);
         if (subMatch && subMatch.path) {
            const subPath = subMatch.path.startsWith('/') ? subMatch.path : '/' + subMatch.path;
            // Only use subMatch if it's more specific (longer) than current best
            if (subPath.length > bestMatchLength) {
               bestMatch = subMatch;
               bestMatchLength = subPath.length;
            }
         }
      }
   }

   return bestMatch;
};

const getRouteInfo = (navTree: NavInfo | NavInfo[], key: string): NavInfo | undefined => {
   if (!Array.isArray(navTree) && navTree.key === key) {
      return navTree;
   }
   let activedRoute: NavInfo | undefined;
   let isIncludeActivedRoute = false;
   for (const p in navTree) {
      if (
         p !== 'icon' &&
         // eslint-disable-next-line no-prototype-builtins
         navTree.hasOwnProperty(p) &&
         typeof (navTree as any)[p] === 'object'
      ) {
         if (isPlainObject((navTree as any)[p]) && (navTree as any)[p].subMenu?.length > 0) {
            if ((navTree as any)[p].subMenu.some((el: NavInfo) => el.key === key)) {
               isIncludeActivedRoute = true;
            }
         }

         activedRoute = getRouteInfo((navTree as any)[p], key);

         if (activedRoute) {
            if (isIncludeActivedRoute) {
               activedRoute.parentKey = (navTree as any)[p].key;
            }

            return activedRoute;
         }
      }
   }
   return activedRoute;
};

const findNestedRoute = (navTree: NavigationTree[], key: string): boolean => {
   const found = navTree.find(node => {
      return node.key === key;
   });
   if (found) {
      return true;
   }
   return navTree.some(c => findNestedRoute(c.subMenu, key));
};

const getTopRouteKey = (navTree: NavigationTree[], key: string): NavigationTree => {
   let foundNav = {} as NavigationTree;
   navTree.forEach(nav => {
      if (findNestedRoute([nav], key)) {
         foundNav = nav;
      }
   });
   return foundNav;
};

function useMenuActive(navTree: NavigationTree[], key: string) {
   const location = useLocation();
   const locationPath = location.pathname;

   const activedRoute = useMemo(() => {
      // First try to find by key (existing behavior for exact matches)
      let route = getRouteInfo(navTree, key);

      // Normalize location path for comparison
      const normalizedLocationPath = locationPath.startsWith('/') ? locationPath : '/' + locationPath;

      // If we found a route by key, check if it's an exact or pattern match
      if (route && route.path) {
         const routePath = route.path.startsWith('/') ? route.path : '/' + route.path;
         // If it's an exact match or pattern match, use it
         if (normalizedLocationPath === routePath || matchesPath(normalizedLocationPath, routePath)) {
            return route;
         }
      }

      // Try to find by exact path match first
      route = findNavByPath(navTree, locationPath);
      if (route) {
         return route;
      }

      // If no exact match, find the best parent nav that the location path starts with
      // This handles nested routes - e.g., /admin/blueprints/:id should highlight "Blueprints"
      const parentNav = findParentNavByPath(navTree, locationPath);
      if (parentNav) {
         return parentNav;
      }

      // Fallback to key-based lookup if nothing else matches
      return route || undefined;
   }, [navTree, key, locationPath]);

   const includedRouteTree = useMemo(() => {
      const included = getTopRouteKey(navTree, key);
      return included;
   }, [navTree, key]);

   return { activedRoute, includedRouteTree };
}

export default useMenuActive;
