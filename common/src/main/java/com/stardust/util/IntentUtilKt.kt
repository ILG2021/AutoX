package com.stardust.util

import android.content.Context
import android.content.Intent

object IntentUtilKt {
    fun launchFb(context: Context): Boolean {
        return try {
            val intent = context.packageManager.getLaunchIntentForPackage("com.facebook.katana")
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}