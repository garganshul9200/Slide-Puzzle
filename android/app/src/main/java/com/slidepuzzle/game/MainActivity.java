package com.slidepuzzlequest.game;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int DEFAULT_CHROME = 0xFF08202B;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        applyChromeColor(DEFAULT_CHROME);
        webView.addJavascriptInterface(new ChromeBridge(), "SlidePuzzleChrome");
        webView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                WebView.HitTestResult hit = ((WebView) v).getHitTestResult();
                if (hit != null && hit.getType() == WebView.HitTestResult.EDIT_TEXT_TYPE) {
                    return false;
                }
                return true;
            }
        });
        webView.setHapticFeedbackEnabled(false);
    }

    private void applyChromeColor(int color) {
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(color);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }
        getWindow().getDecorView().setBackgroundColor(color);
        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(color);
        View parent = (View) webView.getParent();
        if (parent != null) {
            parent.setBackgroundColor(color);
        }
    }

    private class ChromeBridge {
        @JavascriptInterface
        public void setColor(String hex) {
            try {
                int color = Color.parseColor(hex);
                runOnUiThread(() -> applyChromeColor(color));
            } catch (IllegalArgumentException ignored) {
            }
        }
    }
}
