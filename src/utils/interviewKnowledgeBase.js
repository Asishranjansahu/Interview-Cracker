/**
 * Comprehensive Interview Knowledge Base and Intelligent Answer Generator
 * Supports instant, real-time STAR answering across Java, Spring Boot, Databases,
 * System Design, Cloud/DevOps, Fullstack, and Behavioral domains.
 */

export const TOPIC_KNOWLEDGE_BASE = [
  // 1. JAVA OOP & FUNDAMENTALS
  {
    patterns: [/polymorphism/i, /inheritance/i, /encapsulation/i, /abstraction/i, /oops? concepts?/i, /solid principles?/i],
    headline: "Object-Oriented Programming (OOP) in Java centers on Abstraction, Encapsulation, Inheritance, and Polymorphism, promoting modular, reusable, and loosely coupled enterprise software.",
    bullets: [
      "Abstraction hides internal implementation details via interfaces and abstract classes.",
      "Encapsulation restricts direct field access using private modifiers and provides validated getters/setters.",
      "Inheritance enables code reuse and hierarchy ('is-a' relationship), though composition ('has-a') is often preferred for loose coupling.",
      "Polymorphism supports Compile-time (Method Overloading) and Runtime (Method Overriding with dynamic method dispatch).",
      "Adheres to SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion."
    ],
    tradeoff: "Deep inheritance hierarchies increase coupling; favor composition over inheritance where possible.",
    spoken: "In Java, OOP provides the foundation for scalable systems. I apply Encapsulation to protect business state, Abstraction and Interfaces to decouple service contracts, and Runtime Polymorphism so services can swap implementations seamlessly without breaking dependent callers.",
    category: "Java Core"
  },

  // 2. JAVA COLLECTIONS: HASHMAP INTERNALS
  {
    patterns: [/hashmap/i, /concurrenthashmap/i, /how does hashmap work/i, /collision in hashmap/i, /hashcode and equals/i],
    headline: "HashMap uses an array of Node buckets with hashing, where collisions are resolved via linked lists and converted to Red-Black Trees (TreeNode) in Java 8+ when bucket depth reaches 8.",
    bullets: [
      "Internal structure: Entry<K,V>[] table; default initial capacity is 16 and load factor is 0.75.",
      "Index calculation: index = (n - 1) & hash(key.hashCode()).",
      "Collision handling: Separate Chaining. In Java 8+, converts from LinkedList to Red-Black Tree when threshold >= 8 (O(log n) worst-case lookup).",
      "ConcurrentHashMap provides thread safety using CAS operations and synchronized blocks on individual bucket heads (Lock Striping) without locking the whole map.",
      "Important rule: Always override equals() and hashCode() together to maintain the contract for key lookups."
    ],
    tradeoff: "ConcurrentHashMap incurs slightly more memory per node than HashMap, but enables high-throughput concurrent reads and writes.",
    spoken: "HashMap computes the bucket index using key's hashcode. When hash collisions happen, items are stored in a linked bucket. In Java 8, if a bucket grows past 8 nodes, it treeifies into a Red-Black Tree for O(log n) search. For thread-safe concurrent access, I use ConcurrentHashMap to avoid locking entire table partitions.",
    category: "Java Core"
  },

  // 3. ARRAYLIST VS LINKEDLIST / LISTS / SETS
  {
    patterns: [/arraylist/i, /linkedlist/i, /arraylist vs linkedlist/i, /hashset/i, /treeset/i, /collections? framework/i],
    headline: "ArrayList uses a dynamically resizing contiguous array providing O(1) random access, whereas LinkedList uses doubly-linked nodes with O(1) insertions/deletions at endpoints but O(n) traversal.",
    bullets: [
      "ArrayList: Backed by Object[]; resizing grows capacity by 50% (oldCapacity + (oldCapacity >> 1)); cache-friendly due to CPU memory locality.",
      "LinkedList: Backed by Node<E> pointers (prev, next, item); higher memory footprint due to node pointer overhead.",
      "HashSet is backed internally by a HashMap (where map value is a dummy PRESENT object); provides O(1) average lookup.",
      "TreeSet uses a Red-Black tree structure guaranteeing O(log n) time and natural sorted order via Comparable/Comparator."
    ],
    tradeoff: "ArrayList is almost always preferred over LinkedList in modern Java due to CPU cache locality, even for occasional mid-list insertions.",
    spoken: "I prefer ArrayList for the vast majority of operations because contiguous memory layout makes it much faster for CPU caching and O(1) indexed reads. LinkedList is only advantageous if you perform continuous insertions and deletions strictly at the head and tail without index random access.",
    category: "Java Core"
  },

  // 4. JVM, GARBAGE COLLECTION & MEMORY
  {
    patterns: [/garbage collect/i, /memory leak/i, /jvm/i, /heap vs stack/i, /g1 gc/i, /zgc/i, /metaspace/i, /out of memory/i],
    headline: "Java GC automatically frees unreferenced heap memory across Young (Eden/Survivor) and Old generations, and I prevent memory leaks by managing resource lifecycles and analyzing heap dumps.",
    bullets: [
      "Memory layout: Stack holds thread frames, local variables, and primitive values; Heap holds all object instances and metadata (Metaspace holds class definitions).",
      "Generational Hypothesis: Most objects die young in Eden; survivors move through S0/S1 and promote to Tenured/Old Gen after reaching aging threshold (tenuring threshold).",
      "Garbage Collectors: G1 GC (default) partitions heap into regions to target pause times; ZGC/Shenandoah provide concurrent sub-millisecond pauses for large heaps.",
      "Preventing leaks: Use try-with-resources for JDBC/IO handles, clear thread-local variables (ThreadLocal.remove()), and avoid unbounded static collections.",
      "Debugging OOM: Capture heap dumps (-XX:+HeapDumpOnOutOfMemoryError) and analyze retaining roots using Eclipse MAT or JProfiler."
    ],
    tradeoff: "Low-pause collectors like ZGC trade a slight percentage of CPU throughput to maintain sub-millisecond GC pauses.",
    spoken: "The JVM separates execution stack from heap allocations. G1 GC optimizes pauses by dividing the heap into regions and prioritizing regions with the most reclaimable garbage. In my projects, I eliminate memory leaks by closing I/O handles with try-with-resources and clearing ThreadLocals after HTTP request processing.",
    category: "Java Core"
  },

  // 5. JAVA 8+ STREAMS & LAMBDAS
  {
    patterns: [/stream api/i, /streams? vs collection/i, /lambda/i, /functional interface/i, /optional/i, /java 8/i],
    headline: "Java 8 Streams provide declarative, functional data pipelines supporting lazy intermediate operations (filter, map, flatMap) and eager terminal operations (collect, reduce, count).",
    bullets: [
      "Collections hold actual in-memory data structures; Streams are pipelines that compute data on-demand without mutating the original source.",
      "Intermediate operations (filter, map, sorted, distinct) are lazy and only execute when a terminal operation is invoked.",
      "Terminal operations (collect, forEach, reduce, findFirst) trigger computation and close the stream.",
      "Functional Interfaces (@FunctionalInterface): Predicate<T> (boolean test), Function<T,R> (transform), Consumer<T> (accept action), Supplier<T> (generate value).",
      "Optional<T> avoids NullPointerExceptions by explicitly representing presence or absence."
    ],
    tradeoff: "Parallel streams (parallelStream) use the shared ForkJoinPool.commonPool(); avoid using them for blocking I/O operations.",
    spoken: "Streams bring functional programming to Java. I use streams for clean transformations, such as mapping JPA entities to DTOs or filtering collections. Because intermediate operations are lazy, the JVM optimizes pipeline execution and avoids unnecessary intermediate array allocations.",
    category: "Java Core"
  },

  // 6. MULTITHREADING, CONCURRENCY & SYNCHRONIZATION
  {
    patterns: [/multithreading/i, /thread/i, /deadlock/i, /volatile/i, /synchronized/i, /executorservice/i, /completablefuture/i, /concurrency/i],
    headline: "Java concurrency manages multi-threaded execution through synchronization primitives, atomic classes, and thread pool executors to maximize throughput while avoiding race conditions and deadlocks.",
    bullets: [
      "volatile keyword ensures visibility across CPU core caches by reading/writing directly to main memory (prevents instruction reordering).",
      "synchronized block/method guarantees mutual exclusion and memory visibility via intrinsic monitor locks.",
      "ExecutorService & ThreadPoolExecutor manage reusable worker threads (e.g. FixedThreadPool, CachedThreadPool) avoiding high thread creation costs.",
      "Deadlock conditions (Coffman): Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Prevent by acquiring locks in consistent global order.",
      "CompletableFuture enables non-blocking asynchronous pipeline chaining (thenApply, thenCompose, exceptionally)."
    ],
    tradeoff: "Over-synchronizing causes thread contention and CPU context-switch latency; prefer lock-free Atomic variables (AtomicInteger) or Concurrent collections.",
    spoken: "For robust concurrency, I prefer high-level abstractions like ExecutorService and CompletableFuture over raw Thread creation. When shared mutable state is required, I use ConcurrentHashMap or Atomic references to avoid heavy synchronized lock bottlenecks and maintain lock ordering to prevent deadlocks.",
    category: "Java Core"
  },

  // 7. EXCEPTION HANDLING
  {
    patterns: [/exception handling/i, /checked vs unchecked/i, /try catch/i, /try with resources/i, /custom exception/i],
    headline: "Java classifies exceptions into Checked (compile-time, subclass of Exception) for recoverable external conditions and Unchecked (RuntimeExceptions) for programming errors and illegal states.",
    bullets: [
      "Checked Exceptions (e.g. IOException, SQLException) must be declared in throws or handled in try-catch.",
      "Unchecked Exceptions (e.g. NullPointerException, IllegalArgumentException) inherit from RuntimeException.",
      "try-with-resources: Auto-closes any object implementing AutoCloseable/Closeable, eliminating manual finally blocks.",
      "Best practice: Create meaningful custom domain exceptions (e.g. ResourceNotFoundException, OrderProcessingException) and handle them globally using Spring's @RestControllerAdvice.",
      "Never swallow exceptions with empty catch blocks or catch generic Throwable directly."
    ],
    tradeoff: "Modern enterprise architectures favor unchecked exceptions with centralized global exception handlers to keep service signatures clean.",
    spoken: "I structure exception handling using custom runtime exceptions wrapped in domain contexts. In Spring Boot, I use @RestControllerAdvice and @ExceptionHandler to intercept exceptions globally and return consistent RFC 7807 Problem Detail JSON responses to clients.",
    category: "Java Core"
  },

  // 8. SPRING BOOT ARCHITECTURE & DEPENDENCY INJECTION
  {
    patterns: [/spring boot/i, /dependency injection/i, /inversion of control/i, /ioc/i, /autowired/i, /bean lifecycle/i, /spring annotations/i],
    headline: "Spring Boot simplifies enterprise Java with Inversion of Control (IoC), opinionated auto-configuration, and embedded servers, using Constructor Injection for clean dependency management.",
    bullets: [
      "IoC & Dependency Injection: The Spring ApplicationContext manages object creation, wiring, and lifecycle rather than classes instantiating dependencies directly.",
      "Constructor Injection vs @Autowired: Constructor injection guarantees immutability (final fields), prevents circular dependencies at startup, and allows easy unit testing with Mockito.",
      "@SpringBootApplication combines @Configuration, @EnableAutoConfiguration, and @ComponentScan.",
      "Bean Scopes: Singleton (default, one instance per container), Prototype (new instance on request), Request, Session, Websocket.",
      "Layered structure: Controller (@RestController) -> Service (@Service) -> Repository (@Repository) -> Database."
    ],
    tradeoff: "Auto-configuration accelerates development, but developers must understand underlying Starter dependencies to avoid unintended default beans.",
    spoken: "Spring Boot handles boilerplate so we focus on business logic. I use constructor-based injection with Lombok @RequiredArgsConstructor for immutable services. In controllers, I validate DTOs with @Valid and delegate business workflows to @Transactional service classes.",
    category: "Spring Boot"
  },

  // 9. SPRING DATA JPA, HIBERNATE & N+1 PROBLEM
  {
    patterns: [/spring data jpa/i, /hibernate/i, /n\+1/i, /orm/i, /entity mapping/i, /transactional/i, /lazy loading/i],
    headline: "Spring Data JPA abstracts Hibernate ORM with type-safe repositories, where the N+1 select problem is solved using JOIN FETCH, EntityGraphs, or DTO projections.",
    bullets: [
      "N+1 Query Problem: Loading 1 parent entity with N children triggers 1 query for the parent plus N individual queries for each child. Solved via 'JOIN FETCH' in JPQL or @EntityGraph.",
      "Entity Fetch Types: Prefer FetchType.LAZY for @OneToMany and @ManyToMany to prevent fetching huge relational graphs into memory.",
      "@Transactional: Manages database transactions declaratively; defaults rollback on unchecked RuntimeException (use rollbackFor = Exception.class for checked).",
      "Dirty Checking: Hibernate automatically detects modified properties on managed entities and emits minimal UPDATE statements upon transaction commit.",
      "First-level cache is scoped to the Hibernate Session/EntityManager; Second-level cache (Ehcache/Redis) is shared across sessions."
    ],
    tradeoff: "Eager fetching is convenient for tiny relations but quickly causes severe database query multiplication in production.",
    spoken: "With Spring Data JPA, I ensure relationships are configured with FetchType.LAZY. To eliminate the classic N+1 query trap, I write custom repository queries using JOIN FETCH or specify @EntityGraph. I define @Transactional at the service layer so database updates commit atomically.",
    category: "Spring Boot"
  },

  // 10. SPRING SECURITY & JWT AUTHENTICATION
  {
    patterns: [/spring security/i, /jwt/i, /json web token/i, /authentication/i, /authorization/i, /oauth2/i, /securityfilterchain/i],
    headline: "Spring Security secures REST endpoints using a customizable SecurityFilterChain, where stateless JWT tokens authenticate API requests via Authorization Bearer headers.",
    bullets: [
      "Stateless Architecture: Server does not maintain HTTP sessions; client passes signed JWT token in 'Authorization: Bearer <token>' header.",
      "JWT Structure: Header (algorithm & token type), Payload (claims, user subject, roles, expiration), Signature (HMAC SHA-256 or RSA).",
      "SecurityFilterChain: Intercepts requests using custom OncePerRequestFilter to validate JWT signature and populate SecurityContextHolder.",
      "Password Hashing: Always use BCryptPasswordEncoder with adaptive work factor to resist brute-force attacks.",
      "Role-based Access: Enforce endpoint security using @PreAuthorize('hasRole(\"ADMIN\")') or HttpSecurity matchers."
    ],
    tradeoff: "JWTs cannot be easily revoked before expiration without maintaining a token blacklist in a fast distributed store like Redis.",
    spoken: "I implement stateless authentication in Spring Boot using Spring Security and JWT. When a user logs in, the server signs a JWT with expiration claims. A custom JWT filter intercepts subsequent requests, validates the signature, and sets the authentication context for @PreAuthorize role checks.",
    category: "Spring Boot"
  },

  // 11. MICROSERVICES ARCHITECTURE & DISTRIBUTED SYSTEMS
  {
    patterns: [/microservices?/i, /monolith vs microservices/i, /service discovery/i, /api gateway/i, /circuit breaker/i, /resilience4j/i, /kafka/i],
    headline: "Microservices decouple large systems into independently deployable, domain-driven services communicating via lightweight REST APIs and asynchronous event brokers like Kafka.",
    bullets: [
      "Service Discovery: Netflix Eureka / Consul dynamically registers microservice host/port instances for client-side load balancing via OpenFeign.",
      "API Gateway (Spring Cloud Gateway): Central entry point handling authentication, rate limiting, routing, and SSL termination.",
      "Circuit Breaker (Resilience4j): Prevents cascading downstream outages with state transitions (CLOSED -> OPEN -> HALF-OPEN) and fallback responses.",
      "Asynchronous Event-Driven: Apache Kafka/RabbitMQ decouples publishers from consumers for high-throughput event processing and eventual consistency.",
      "Distributed Tracing: Micrometer Tracing / OpenTelemetry / Zipkin injects Trace IDs across microservices for end-to-end latency diagnostics."
    ],
    tradeoff: "Microservices introduce distributed operational complexity, network latency, and eventual consistency challenges compared to modular monoliths.",
    spoken: "In microservices architectures, each service owns its isolated database schema. I use Spring Cloud Gateway for unified ingress and security, OpenFeign with Resilience4j for resilient inter-service calls, and Kafka for asynchronous event propagation to keep services decoupled and fault-tolerant.",
    category: "System Design"
  },

  // 12. SQL QUERY OPTIMIZATION & INDEXING
  {
    patterns: [/sql/i, /database index/i, /query optimization/i, /b-tree/i, /explain plan/i, /acid properties/i, /sql vs nosql/i],
    headline: "SQL query performance is optimized by analyzing EXPLAIN execution plans, indexing high-cardinality search/join keys with B-Trees, avoiding SELECT *, and applying pagination.",
    bullets: [
      "B-Tree Indexing: Provides O(log n) lookups, range scans, and sorting. Follows the Leftmost Prefix Rule for composite indexes (colA, colB).",
      "Clustered Index: Determines the physical storage order of table data (typically the Primary Key); Non-clustered index stores index keys with pointers back to data rows.",
      "EXPLAIN ANALYZE: Reveals full table scans, sequential disk reads, hash joins, and temporary sorting overhead.",
      "ACID: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (transaction levels), Durability (persisted to write-ahead log).",
      "SQL vs NoSQL: SQL (PostgreSQL, MySQL) for structured ACID relational transactions; NoSQL (MongoDB, DynamoDB) for flexible schema, horizontal partitioning, and unstructured documents."
    ],
    tradeoff: "Every additional index accelerates SELECT queries but introduces overhead for INSERT, UPDATE, and DELETE operations due to index tree rebalancing.",
    spoken: "When optimizing slow queries, I run EXPLAIN to check if indexes are being utilized. I ensure composite indexes match the query's WHERE and ORDER BY columns in leftmost order, eliminate wildcard SELECT queries, and use database pagination so memory is never exhausted by large datasets.",
    category: "Database"
  },

  // 13. REDIS CACHING & MESSAGE BROKERS
  {
    patterns: [/redis/i, /caching/i, /cache invalidation/i, /message queue/i, /rabbitmq/i, /cache-aside/i],
    headline: "Redis provides in-memory sub-millisecond key-value caching using the Cache-Aside pattern with TTL expiration to offload heavy database read queries.",
    bullets: [
      "Cache-Aside Pattern: Application checks Redis first; on cache miss, reads from DB, writes result back to Redis with a TTL, and returns to client.",
      "Eviction Policies: LRU (Least Recently Used), LFU (Least Frequently Used), and volatile-ttl.",
      "Cache Invalidation: Updates to DB write-through or invalidate associated Redis keys to prevent stale data reads.",
      "Cache Stampede / Thundering Herd: Mitigated by locking or using probabilistic early expiration.",
      "Data Structures: Strings, Hashes, Lists, Sets, Sorted Sets (ZSet for real-time leaderboards)."
    ],
    tradeoff: "Caching introduces eventual consistency risks; cache keys must have appropriate TTLs and explicit invalidation triggers on database mutations.",
    spoken: "I use Redis to cache expensive read query results using the Cache-Aside pattern. By configuring appropriate TTLs and invalidating cache keys upon entity updates, we reduce database query volume by over 80% while maintaining sub-millisecond API response times.",
    category: "System Design"
  },

  // 14. REST API DESIGN & HTTP STANDARDS
  {
    patterns: [/rest api/i, /http methods?/i, /status codes?/i, /idempotent/i, /restful/i, /api design/i],
    headline: "RESTful APIs expose clean resource-oriented endpoints using standard HTTP verbs, stateless request handling, standard JSON representations, and appropriate HTTP status codes.",
    bullets: [
      "HTTP Verbs: GET (retrieve, idempotent), POST (create, non-idempotent), PUT (replace/upsert, idempotent), PATCH (partial update), DELETE (remove, idempotent).",
      "Status Codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Internal Error).",
      "Idempotency: Making identical requests multiple times produces the same server state as a single request (GET, PUT, DELETE).",
      "API Versioning: Use URI path versioning (/api/v1/users) or Header versioning for backward compatibility.",
      "Pagination & Filtering: Pass query parameters (?page=0&size=20&sort=createdAt,desc) and return metadata headers."
    ],
    tradeoff: "Strict RESTful schemas require discipline around plural resource nouns and avoid RPC-style action verbs in endpoint paths.",
    spoken: "I design REST APIs around plural resources like /api/v1/orders. I use POST for creation returning 201 Created with Location header, PUT/PATCH for updates, and GET for idempotent retrieval. Errors are returned with standard RFC 7807 problem details and appropriate 4xx/5xx codes.",
    category: "System Design"
  },

  // 15. DOCKER, CI/CD & DEVOPS
  {
    patterns: [/docker/i, /container/i, /dockerfile/i, /kubernetes/i, /ci\/cd/i, /jenkins/i, /github actions/i, /aws/i],
    headline: "Docker containerizes applications with their dependencies into portable, lightweight images deployed through automated CI/CD pipelines to AWS or Kubernetes.",
    bullets: [
      "Dockerfile: Multi-stage builds (build stage with JDK Maven/Gradle, runtime stage with slim JRE) to keep image sizes minimal (<150MB) and secure.",
      "Container vs VM: Containers share the host OS kernel and isolate user space, booting in milliseconds with negligible overhead compared to hypervisor VMs.",
      "Kubernetes (K8s): Orchestrates containerized pods, handling automated horizontal pod autoscaling (HPA), rolling updates, self-healing, and service discovery.",
      "CI/CD Pipeline: Triggered on git push; runs automated unit/integration tests with Maven, builds Docker image, scans vulnerabilities, and deploys to staging/prod.",
      "AWS Services: EC2 (virtual instances), S3 (object storage), RDS (managed relational DB), ECS/EKS (container orchestration)."
    ],
    tradeoff: "Containerization adds build pipeline steps but eliminates 'works on my machine' environmental discrepancies.",
    spoken: "I package Spring Boot applications using multi-stage Dockerfiles with Eclipse Temurin JRE base images to keep containers lean. In GitHub Actions CI/CD pipelines, every pull request automatically runs unit and integration test suites before building and deploying the Docker container to cloud environments.",
    category: "DevOps & Cloud"
  },

  // 16. REACT & FRONTEND FUNDAMENTALS
  {
    patterns: [/react/i, /react hooks/i, /useeffect/i, /virtual dom/i, /state management/i, /frontend/i],
    headline: "React builds dynamic single-page web applications using declarative components, a Virtual DOM diffing engine, and built-in hooks (useState, useEffect, useMemo, useCallback).",
    bullets: [
      "Virtual DOM: In-memory representation of real DOM; React computes reconciliation diffs and applies minimal batched mutations to the browser DOM.",
      "useState & useEffect: useState manages local reactive state; useEffect manages side-effects (data fetching, subscriptions) with strict dependency arrays.",
      "useMemo & useCallback: Memoize expensive computations and callback function references to prevent unnecessary child re-renders.",
      "Component Composition: Props pass data down; callbacks pass events up; Context API or state stores share global state.",
      "Clean UI: Tailwind CSS provides utility-first responsive styling without external CSS overhead."
    ],
    tradeoff: "Over-using useMemo/useCallback adds memory and comparison overhead; only apply them when memoizing expensive subtrees or stabilizing dependency arrays.",
    spoken: "I develop responsive frontends in React using functional components and hooks. I structure UI with clear separation between stateful container components and presentational views, managing side effects cleanly in useEffect and ensuring accessibility across devices.",
    category: "Frontend"
  },

  // 17. BEHAVIORAL: TELL ME ABOUT YOURSELF
  {
    patterns: [/tell me about yourself/i, /walk me through your resume/i, /introduce yourself/i, /your background/i],
    headline: "I am a proactive software engineer with a strong foundation in Java, Spring Boot, and database architectures, focused on building performant REST services and solving real user problems.",
    bullets: [
      "Present: Building backend services in Java/Spring Boot, designing REST APIs, and writing clean, tested code.",
      "Past Foundation: Solid CS background in Data Structures, Algorithms, Object-Oriented Design, and relational databases (SQL).",
      "Projects: Developed full-stack and microservices projects with secure JWT authentication, query optimization, and CI/CD pipelines.",
      "Future / Motivation: Excited to bring rigorous engineering habits, curiosity, and collaborative energy to deliver scalable value at this company."
    ],
    tradeoff: "Keep the introduction focused on technical achievements, problem-solving mindset, and alignment with the target role within 90 seconds.",
    spoken: "I'm a software developer specializing in backend development with Java and Spring Boot. I have hands-on experience designing RESTful APIs, optimizing SQL database queries, and building modular systems with automated unit test coverage. I love taking ownership of features, collaborating in Agile teams, and I'm excited about this opportunity to contribute to high-impact systems here.",
    category: "Behavioral"
  },

  // 18. BEHAVIORAL: WHY THIS COMPANY
  {
    patterns: [/why do you want to join/i, /why this company/i, /why work here/i, /why should we hire you/i],
    headline: "I want to join your team because of your commitment to engineering excellence, culture of innovation, and the opportunity to solve complex scalability challenges on high-impact products.",
    bullets: [
      "Alignment with company mission and technological stack (Java, Cloud, Microservices).",
      "Desire to work with high-caliber senior engineers and contribute clean, tested, high-velocity code.",
      "Excitement about the scale, customer impact, and technical growth opportunities in this specific engineering team.",
      "Proven track record of taking initiative, fast learning, and delivering reliable backend services."
    ],
    tradeoff: "Demonstrate concrete knowledge of the company's product domain rather than generic praise.",
    spoken: "I've been following your engineering work and reputation for building resilient enterprise platforms. My technical background in Java, Spring Boot, and API architecture aligns directly with what this team is building. I want to be in an environment with high engineering standards where I can solve real technical problems, learn from great mentors, and make an immediate positive contribution.",
    category: "Behavioral"
  },

  // 19. BEHAVIORAL: CHALLENGING BUG / PRODUCTION ISSUE (STAR)
  {
    patterns: [/challenging bug/i, /difficult bug/i, /production issue/i, /debugging/i, /mistake/i, /outage/i],
    headline: "When resolving a critical production issue under tight deadlines, I isolated the root cause using structured logs, reproduced it in a test sandbox, implemented a verified fix, and added automated tests.",
    bullets: [
      "Situation: Discovered an intermittent concurrency bug during load testing that caused duplicate record inserts.",
      "Task: Identify root cause and fix before production deployment without delaying the sprint release.",
      "Action: Analyzed application logs and thread dumps, spotted a missing unique database constraint and un-synchronized check-then-act logic, and refactored to use database unique index + transactional upsert.",
      "Result: Zero duplicate records in automated stress testing, deployed on schedule with 100% test pass rate."
    ],
    tradeoff: "Prioritize quick mitigation to protect data integrity, followed by permanent architectural prevention and post-mortem documentation.",
    spoken: "During high-traffic testing on a previous project, we observed intermittent duplicate order creations. I reproduced the issue using concurrent mock requests and found that the service relied on an in-memory check rather than an atomic database constraint. I added a unique compound database index and wrapped the workflow in a declarative transaction. We verified with automated regression tests and shipped on time.",
    category: "Behavioral"
  },

  // 20. BEHAVIORAL: CONFLICT / CODE REVIEW PUSHBACK (STAR)
  {
    patterns: [/conflict/i, /disagreement/i, /teammate/i, /code review/i, /pushback/i],
    headline: "I approach technical disagreements with empathy and objective data, focusing on project maintainability, latency benchmarks, and team consensus to deliver the best outcome.",
    bullets: [
      "Situation: A teammate and I disagreed on whether to use synchronous REST API calls or asynchronous Kafka events for notification dispatch.",
      "Task: Reach consensus without stalling sprint progress or causing friction.",
      "Action: Scheduled a 20-minute sync to map throughput requirements, failure modes, and latency targets; built a quick prototype to benchmark both.",
      "Result: Agreed on asynchronous event model for decoupled reliability, documented in our team ADR, and delivered feature seamlessly."
    ],
    tradeoff: "Invest a brief time in empirical benchmarks to resolve debates with data rather than prolonged subjective discussions.",
    spoken: "When technical disagreements arise, I focus on what best serves the codebase and user. In a recent architecture discussion regarding API communication, a peer preferred synchronous REST while I recommended an async message queue. I mapped out failure scenarios and showed how an async queue protected us from third-party outages. We agreed, documented the decision in an ADR, and completed the feature smoothly.",
    category: "Behavioral"
  },

  // 21. BEHAVIORAL: STRENGTHS & WEAKNESSES
  {
    patterns: [/strengths? and weakness/i, /greatest weakness/i, /greatest strength/i, /area of improvement/i],
    headline: "My greatest strength is systematic problem solving and clean modular coding; an area I am actively improving is balancing rapid initial prototyping with early documentation.",
    bullets: [
      "Strength: Fast diagnostic ability, rigorous unit testing with JUnit/Mockito, and deep curiosity for system internals.",
      "Weakness: Tendency to dive deep into premature code optimization during early feature drafting.",
      "Mitigation: Now establish clear MVP criteria first, build working end-to-end functionality, and profile with benchmarks before optimizing.",
      "Continuous Growth: Actively reading engineering blogs, practicing system design, and building side projects."
    ],
    tradeoff: "Frame weaknesses genuinely with active, measurable steps being taken to improve.",
    spoken: "My greatest strength is my disciplined approach to problem-solving and clean code. I make sure my APIs are well-structured, thoroughly tested, and easy for others to maintain. An area I've been improving is resisting the urge to prematurely optimize architecture during initial spikes. I now focus on shipping a clean working MVP first, and then using profiling data to guide performance tuning.",
    category: "Behavioral"
  }
];

/**
 * Intelligent topic finder that matches patterns or creates dynamic answers
 */
export function findMatchingAnswer({ question, session, candidateAnswer, mode = 'live' }) {
  const cleanQ = (question || '').trim();
  const qLower = cleanQ.toLowerCase();
  const role = session?.role || 'Software Engineer';
  const company = session?.company || 'the target company';

  // Check against our curated knowledge base
  for (const topic of TOPIC_KNOWLEDGE_BASE) {
    const isMatch = topic.patterns.some((pat) => pat.test(cleanQ));
    if (isMatch) {
      return {
        headline_answer: topic.headline,
        bullets: topic.bullets,
        tradeoff: topic.tradeoff,
        full_answer: topic.spoken,
        note: `AI Co-Pilot response for ${topic.category}.`,
        category: topic.category,
      };
    }
  }

  // Extract keywords to build a tailored dynamic technical response
  const words = cleanQ.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const subject = words.slice(0, 4).join(' ') || 'this technical requirement';

  return {
    headline_answer: `For ${subject} in a ${role} environment at ${company}, I structure the solution around clear requirements, decoupled design, and automated testing.`,
    bullets: [
      `Clarify functional and non-functional requirements (throughput, latency, error handling, edge cases) for ${subject}.`,
      `Implement modular, decoupled components following SOLID design principles and standard design patterns.`,
      `Ensure comprehensive automated test coverage (unit testing with JUnit/Mockito and integration test verification).`,
      `Incorporate structured logging, metrics, and observability to monitor performance in production.`
    ],
    tradeoff: `Balancing rapid delivery with extensibility: Deliver clean MVP first, then refactor based on observability metrics.`,
    full_answer: `When addressing ${subject}, I start by analyzing edge cases and performance requirements. I implement a clean domain model with strict separation of concerns, add unit tests to lock down behavior, and verify integration points before deploying to production.`,
    note: `Dynamic AI Co-Pilot response tailored for ${role}.`,
    category: 'Technical Interview'
  };
}
