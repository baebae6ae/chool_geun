package io.github.baebae6ae.hamsterworklog;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import io.github.baebae6ae.hamsterworklog.widget.WidgetBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
