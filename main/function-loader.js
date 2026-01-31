const fs = require('fs');
const path = require('path');

/**
 * Function Loader Module
 * Loads and caches PHP and WordPress function metadata for IntelliSense
 */

/**
 * Load PHP functions for a specific version
 * @param {string} phpVersion - PHP version (e.g., "8.1.5")
 * @returns {Promise<Array>} - Array of function metadata
 */
const loadPhpFunctions = async (phpVersion) => {
  if (!phpVersion) {
    console.warn('No PHP version provided, returning empty array');
    return [];
  }

  try {
    // Extract major.minor version (e.g., "8.1.5" -> "8.1")
    const majorMinor = phpVersion.match(/^(\d+\.\d+)/);
    if (!majorMinor) {
      console.warn(`Invalid PHP version format: ${phpVersion}`);
      return [];
    }

    const version = majorMinor[1];
    const dataPath = path.join(__dirname, '..', 'data', 'php', `${version}.json`);

    // Check if file exists
    try {
      await fs.promises.access(dataPath);
    } catch (error) {
      console.warn(`PHP ${version} data file not found, trying fallback versions`);

      // Try fallback to earlier versions
      const fallbackVersions = ['8.3', '8.2', '8.1', '8.0', '7.4'];
      for (const fallback of fallbackVersions) {
        const fallbackPath = path.join(__dirname, '..', 'data', 'php', `${fallback}.json`);
        try {
          await fs.promises.access(fallbackPath);
          console.log(`Using fallback PHP ${fallback} data`);
          const content = await fs.promises.readFile(fallbackPath, 'utf8');
          const data = JSON.parse(content);
          return data.functions || [];
        } catch (err) {
          continue;
        }
      }

      return [];
    }

    // Load and parse JSON file
    const content = await fs.promises.readFile(dataPath, 'utf8');
    const data = JSON.parse(content);

    if (!data.functions || !Array.isArray(data.functions)) {
      console.warn(`Invalid data structure in ${dataPath}`);
      return [];
    }

    console.log(`Loaded ${data.functions.length} PHP ${version} functions`);
    return data.functions;
  } catch (error) {
    console.error('Error loading PHP functions:', error);
    return [];
  }
};

/**
 * Load WordPress functions for a specific version
 * @param {string} wpVersion - WordPress version (e.g., "6.4.2")
 * @returns {Promise<Array>} - Array of function metadata
 */
const loadWordPressFunctions = async (wpVersion) => {
  if (!wpVersion) {
    console.warn('No WordPress version provided, returning empty array');
    return [];
  }

  try {
    // Extract major.minor version (e.g., "6.4.2" -> "6.4")
    const majorMinor = wpVersion.match(/^(\d+\.\d+)/);
    if (!majorMinor) {
      console.warn(`Invalid WordPress version format: ${wpVersion}`);
      return [];
    }

    const version = majorMinor[1];
    const dataPath = path.join(__dirname, '..', 'data', 'wordpress', `${version}.json`);

    // Check if file exists
    try {
      await fs.promises.access(dataPath);
    } catch (error) {
      console.warn(`WordPress ${version} data file not found, trying fallback versions`);

      // Try fallback to earlier versions
      const fallbackVersions = ['6.5', '6.4', '6.3', '6.2', '6.1', '6.0'];
      for (const fallback of fallbackVersions) {
        const fallbackPath = path.join(__dirname, '..', 'data', 'wordpress', `${fallback}.json`);
        try {
          await fs.promises.access(fallbackPath);
          console.log(`Using fallback WordPress ${fallback} data`);
          const content = await fs.promises.readFile(fallbackPath, 'utf8');
          const data = JSON.parse(content);
          return data.functions || [];
        } catch (err) {
          continue;
        }
      }

      return [];
    }

    // Load and parse JSON file
    const content = await fs.promises.readFile(dataPath, 'utf8');
    const data = JSON.parse(content);

    if (!data.functions || !Array.isArray(data.functions)) {
      console.warn(`Invalid data structure in ${dataPath}`);
      return [];
    }

    console.log(`Loaded ${data.functions.length} WordPress ${version} functions`);
    return data.functions;
  } catch (error) {
    console.error('Error loading WordPress functions:', error);
    return [];
  }
};

/**
 * Discover PHP functions with caching
 * @param {string} phpVersion - PHP version
 * @param {object} store - electron-store instance
 * @returns {Promise<Array>} - Array of function metadata
 */
const discoverPhpFunctions = async (phpVersion, store) => {
  if (!phpVersion) {
    console.warn('No PHP version provided for discovery');
    return [];
  }

  try {
    // Check cache
    const cacheKey = `php-functions:${phpVersion}`;
    const cached = store ? store.get(cacheKey) : null;

    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(`Using cached PHP functions (${cached.length} functions)`);
      return cached;
    }

    // Load from bundled data
    const functions = await loadPhpFunctions(phpVersion);

    // Cache the result
    if (store && functions.length > 0) {
      store.set(cacheKey, functions);
      console.log(`Cached PHP functions for version ${phpVersion}`);
    }

    return functions;
  } catch (error) {
    console.error('Error discovering PHP functions:', error);
    return [];
  }
};

/**
 * Discover WordPress functions with caching
 * @param {string} wpDirectory - WordPress directory path
 * @param {string} wpVersion - WordPress version
 * @param {object} store - electron-store instance
 * @returns {Promise<Array>} - Array of function metadata
 */
const discoverWordPressFunctions = async (wpDirectory, wpVersion, store) => {
  if (!wpVersion) {
    console.warn('No WordPress version provided for discovery');
    return [];
  }

  try {
    // Check cache
    const cacheKey = `wp-functions:${wpDirectory}:${wpVersion}`;
    const cached = store ? store.get(cacheKey) : null;

    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(`Using cached WordPress functions (${cached.length} functions)`);
      return cached;
    }

    // Load from bundled data
    const functions = await loadWordPressFunctions(wpVersion);

    // Cache the result
    if (store && functions.length > 0) {
      store.set(cacheKey, functions);
      console.log(`Cached WordPress functions for version ${wpVersion}`);
    }

    return functions;
  } catch (error) {
    console.error('Error discovering WordPress functions:', error);
    return [];
  }
};

/**
 * Get all completions (PHP + WordPress)
 * @param {string} wpDirectory - WordPress directory path
 * @param {object} versionInfo - Object with php and wordpress versions
 * @param {object} store - electron-store instance
 * @returns {Promise<Object>} - Object with php and wordpress function arrays
 */
const getAllCompletions = async (wpDirectory, versionInfo, store) => {
  try {
    const [phpFunctions, wordpressFunctions] = await Promise.all([
      discoverPhpFunctions(versionInfo.php, store),
      discoverWordPressFunctions(wpDirectory, versionInfo.wordpress, store)
    ]);

    return {
      php: phpFunctions,
      wordpress: wordpressFunctions,
      versions: versionInfo
    };
  } catch (error) {
    console.error('Error getting all completions:', error);
    return {
      php: [],
      wordpress: [],
      versions: versionInfo
    };
  }
};

/**
 * Clear completion cache for a specific directory
 * @param {string} wpDirectory - WordPress directory path
 * @param {object} store - electron-store instance
 */
const clearCompletionCache = (wpDirectory, store) => {
  if (!store) return;

  try {
    // Get all keys from store
    const allKeys = Object.keys(store.store);

    // Filter keys related to this directory
    const keysToDelete = allKeys.filter(key =>
      key.startsWith('wp-functions:') && key.includes(wpDirectory)
    );

    // Delete each key
    keysToDelete.forEach(key => store.delete(key));

    console.log(`Cleared ${keysToDelete.length} cached function entries for ${wpDirectory}`);
  } catch (error) {
    console.error('Error clearing completion cache:', error);
  }
};

/**
 * Get fallback completions (minimal set when version detection fails)
 * @returns {Object} - Object with php and wordpress function arrays
 */
const getFallbackCompletions = () => {
  return {
    php: [
      {
        label: 'array_map',
        kind: 'Function',
        documentation: 'Applies a callback function to arrays',
        insertText: 'array_map(${1:callback}, ${2:array})',
        detail: 'array array_map(callable $callback, array $array)',
        source: 'core'
      },
      {
        label: 'array_filter',
        kind: 'Function',
        documentation: 'Filters elements of an array using a callback function',
        insertText: 'array_filter(${1:array})',
        detail: 'array array_filter(array $array, ?callable $callback = null)',
        source: 'core'
      },
      {
        label: 'json_encode',
        kind: 'Function',
        documentation: 'Returns the JSON representation of a value',
        insertText: 'json_encode(${1:value})',
        detail: 'string|false json_encode(mixed $value, int $flags = 0)',
        source: 'json'
      },
      {
        label: 'var_dump',
        kind: 'Function',
        documentation: 'Dumps information about a variable',
        insertText: 'var_dump(${1:value})',
        detail: 'void var_dump(mixed $value, mixed ...$values)',
        source: 'core'
      }
    ],
    wordpress: [
      {
        label: 'get_posts',
        kind: 'Function',
        documentation: 'Retrieve a list of posts',
        insertText: 'get_posts(${1:args})',
        detail: 'array get_posts(array $args = [])',
        source: 'core'
      },
      {
        label: 'get_option',
        kind: 'Function',
        documentation: 'Retrieve an option value',
        insertText: 'get_option(${1:option})',
        detail: 'mixed get_option(string $option, mixed $default = false)',
        source: 'core'
      },
      {
        label: 'get_the_title',
        kind: 'Function',
        documentation: 'Retrieve post title',
        insertText: 'get_the_title(${1:post})',
        detail: 'string get_the_title(int|WP_Post $post = 0)',
        source: 'core'
      },
      {
        label: 'wp_insert_post',
        kind: 'Function',
        documentation: 'Insert or update a post',
        insertText: 'wp_insert_post(${1:postarr})',
        detail: 'int|WP_Error wp_insert_post(array $postarr, bool $wp_error = false)',
        source: 'core'
      },
      {
        label: 'add_action',
        kind: 'Function',
        documentation: 'Add a callback to an action hook',
        insertText: 'add_action(${1:hook_name}, ${2:callback})',
        detail: 'true add_action(string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1)',
        source: 'core'
      },
      {
        label: 'add_filter',
        kind: 'Function',
        documentation: 'Add a callback to a filter hook',
        insertText: 'add_filter(${1:hook_name}, ${2:callback})',
        detail: 'true add_filter(string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1)',
        source: 'core'
      }
    ],
    versions: { php: null, wordpress: null }
  };
};

module.exports = {
  loadPhpFunctions,
  loadWordPressFunctions,
  discoverPhpFunctions,
  discoverWordPressFunctions,
  getAllCompletions,
  clearCompletionCache,
  getFallbackCompletions
};
