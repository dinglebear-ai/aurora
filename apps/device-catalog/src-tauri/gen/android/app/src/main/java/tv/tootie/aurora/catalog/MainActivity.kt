package tv.tootie.aurora.catalog

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  private lateinit var catalogWebView: WebView

  override val handleBackNavigation: Boolean = false

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (!this@MainActivity::catalogWebView.isInitialized) {
            dispatchToSystem()
            return
          }

          catalogWebView.evaluateJavascript(CATALOG_BACK_SCRIPT) { handled ->
            if (handled != "true") dispatchToSystem()
          }
        }

        private fun dispatchToSystem() {
          isEnabled = false
          onBackPressedDispatcher.onBackPressed()
          isEnabled = true
        }
      },
    )
  }

  override fun onWebViewCreate(webView: WebView) {
    catalogWebView = webView
  }

  private companion object {
    const val CATALOG_BACK_SCRIPT = """
      (() => {
        const state = history.state;
        if (state?.auroraCatalog === true && Number(state.auroraCatalogDepth) > 0) {
          history.back();
          return true;
        }
        return false;
      })()
    """
  }
}
