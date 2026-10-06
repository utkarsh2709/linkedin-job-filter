/**
 * Reports the nodes touched by DOM mutations under `root`.
 *
 * Batches are handled synchronously in the MutationObserver callback, which runs
 * as a microtask before the next paint, so new cards are hidden without flicker.
 * Only childList and characterData are observed, so our own attribute writes
 * never re-trigger it.
 */
export function observeMutations(root: Node, onNodes: (nodes: Set<Node>) => void): () => void {
  const observer = new MutationObserver((mutations) => {
    const nodes = new Set<Node>();
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        if (mutation.target.parentElement) nodes.add(mutation.target.parentElement);
        continue;
      }
      // Added nodes cover both new cards and content rendered into existing
      // (lazily filled) cards; the filter looks up the card enclosing each node.
      mutation.addedNodes.forEach((node) => node.isConnected && nodes.add(node));
    }
    if (nodes.size > 0) onNodes(nodes);
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
