package com.slidepuzzlequest.game;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
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
}
