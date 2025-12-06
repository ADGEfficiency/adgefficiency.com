document.addEventListener('DOMContentLoaded', function () {
  const searchToggle = document.getElementById('search-toggle')
  const searchInput = document.getElementById('pagefind-search-input')
  const resultsContainer = document.getElementById('pagefind-results')

  let pagefind = null
  let searchTimeout = null
  let isExpanded = false

  async function initPagefind() {
    if (!pagefind) {
      pagefind = await import('/pagefind/pagefind.js')
    }
  }

  function toggleSearch() {
    if (!isExpanded) {
      searchInput.classList.remove('max-w-0')
      searchInput.classList.add('max-w-xs', 'ml-2', 'px-2')
      searchToggle.classList.add('bg-emerald-500', 'text-emerald-50', '-translate-y-1', 'shadow-lg')
      searchToggle.setAttribute('aria-expanded', 'true')
      searchInput.focus()
      isExpanded = true
    } else {
      searchInput.classList.add('max-w-0')
      searchInput.classList.remove('max-w-xs', 'ml-2', 'px-2')
      searchToggle.classList.remove('bg-emerald-500', 'text-emerald-50', '-translate-y-1', 'shadow-lg')
      searchToggle.setAttribute('aria-expanded', 'false')
      searchInput.value = ''
      resultsContainer.innerHTML = ''
      resultsContainer.classList.add('hidden')
      isExpanded = false
    }
  }

  function handleClickOutside(event) {
    const searchContainer = document.getElementById('search-container')
    if (
      !searchContainer.contains(event.target) &&
      isExpanded
    ) {
      toggleSearch()
    }
  }

  function handleEscape(event) {
    if (event.key === 'Escape' && isExpanded) {
      toggleSearch()
      searchToggle.focus()
    }
  }

  async function performSearch(term) {
    if (!pagefind) {
      await initPagefind()
    }

    if (!term.trim()) {
      resultsContainer.innerHTML = ''
      return
    }

    resultsContainer.innerHTML = '<div class="p-4 text-gray-400">Searching...</div>'

    try {
      const search = await pagefind.search(term)

      if (search.results.length === 0) {
        resultsContainer.innerHTML = '<div class="p-4 text-gray-400">No results found</div>'
        return
      }

      const resultsHTML = await Promise.all(
        search.results.slice(0, 10).map(async (result) => {
          const data = await result.data()

          // Extract metadata
          const contentType = data.meta.type || ''
          const competencies = data.meta.competency || []
          const url = data.url

          // Build labels HTML
          let labelsHTML = ''

          // Content type label (blue)
          if (contentType) {
            labelsHTML += `
              <span class="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                ${contentType}
              </span>
            `
          }

          // Competency tags (green)
          const competencyTags = (Array.isArray(competencies) ? competencies : [competencies])
            .filter(c => c)
            .map(c => `
              <span class="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200">
                ${c}
              </span>
            `).join('')

          labelsHTML += competencyTags

          return `
            <a
              href="${url}"
              class="block p-4 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div class="font-semibold text-white mb-2">${data.meta.title || 'Untitled'}</div>
              <div class="flex flex-wrap items-center gap-2">
                ${labelsHTML}
              </div>
            </a>
          `
        })
      )

      resultsContainer.innerHTML = resultsHTML.join('')
      resultsContainer.classList.remove('hidden')
    } catch (error) {
      console.error('Search error:', error)
      resultsContainer.innerHTML = '<div class="p-4 text-red-400">Search failed</div>'
    }
  }

  searchToggle.addEventListener('click', toggleSearch)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)

  searchInput.addEventListener('input', function (e) {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value)
    }, 300)
  })

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const firstResult = resultsContainer.querySelector('a')
      if (firstResult) firstResult.focus()
    }
  })

  resultsContainer.addEventListener('keydown', function (e) {
    const results = Array.from(resultsContainer.querySelectorAll('a'))
    const currentIndex = results.indexOf(document.activeElement)

    if (e.key === 'ArrowDown' && currentIndex < results.length - 1) {
      e.preventDefault()
      results[currentIndex + 1].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentIndex > 0) {
        results[currentIndex - 1].focus()
      } else {
        searchInput.focus()
      }
    }
  })
})
