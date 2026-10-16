import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className="grid min-h-svh place-items-center bg-background" role="status" aria-label="Memuat halaman">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className={`${styles.dot} size-5 rounded-full bg-primary md:size-6`} />
        <span className={`${styles.dot} size-5 rounded-full bg-primary md:size-6`} />
        <span className={`${styles.dot} size-5 rounded-full bg-primary md:size-6`} />
      </div>
    </main>
  );
}
