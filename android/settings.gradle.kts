pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
// CodeQL's Java/Kotlin extractor works by tracing the compiler while it runs.
// Its autobuild does `./gradlew clean` then `./gradlew assemble`, so nothing is
// UP-TO-DATE — but with the build cache warm, `:aurora:compileDebugKotlin`
// resolves FROM-CACHE, the compiler never executes, the extractor observes no
// source, and `codeql database finalize` fails with
// "CodeQL could not process any code written in Java/Kotlin".
//
// That is why the check looked flaky: it passed on a cold cache and failed once
// the cache was populated, including twice on the same commit.
//
// Disable only the local build cache, and only under CodeQL. Normal CI keeps it
// (ci.yml restores ~/.gradle/caches), so Android build times are unaffected.
val isCodeQlBuild = sequenceOf("CODEQL_ACTION_INIT_HAS_RUN", "CODEQL_DIST", "CODEQL_EXTRACTOR_JAVA_ROOT")
    .any { !System.getenv(it).isNullOrBlank() }

buildCache {
    local {
        isEnabled = !isCodeQlBuild
    }
}

rootProject.name = "aurora"
include(":aurora")
include(":app")
