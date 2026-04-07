# **CS5500 PROJECT PROPOSAL**

## **Project Title**

AI-Driven Personalized Shopping Experience for Hypermarket Retail.

## **Student & Institution Details**

Student Names: Yutao Zheng, Xingchen Liu, Xinyi Hu, Junyu Li, Lingyi Zhang  
Client Name: Mengqiu Liu  
Academic Year: 2026 Spring  
Supervisor Name: Sarita Singh

## **1\. Introduction **

With the rapid growth of e-commerce and omnichannel retail, customers increasingly expect personalized, convenient, and intelligent shopping experiences \[1\]. Traditional hypermarket systems rely heavily on manual browsing and generic promotions, which often fail to meet individual customer needs \[2\]. Advances in artificial intelligence, data analytics, and cloud-based web technologies enable the development of systems that can personalize product discovery, recommendations, and customer interaction while integrating both online and in-store experiences \[3\]. This project focuses on designing a web-based intelligent personalized shopping system that enhances customer engagement and operational efficiency for hypermarkets \[4\].

## **2\. Problem Statement**

Current hypermarket shopping systems provide limited personalization and weak integration between online and offline channels \[5\]. Customers often struggle to find relevant products efficiently, especially during seasonal or festival periods \[6\]. Existing systems also lack intelligent assistance for quick queries and shopping list management \[7\]. These limitations lead to reduced customer satisfaction and missed sales opportunities \[8\]. There is a need for an ethical, AI-driven personalized shopping recommendation system that improves product discovery, supports customer interaction \[9\], and seamlessly integrates digital and physical retail environments \[10\].

## **3\. Objectives** 

The project is driven by the following objectives:

* To design and develop an AI-driven personalized shopping web application for hypermarket retail, enabling intelligent product discovery through user profiling and behavioral analysis.  
* To implement a hybrid recommendation engine that combines collaborative filtering and content-based filtering to generate personalized product suggestions based on purchase history, declared preferences, and upcoming festival events.  
* To integrate online and in-store shopping experiences by enabling real-time synchronization of shopping lists between the web application and in-store self-scanning devices.  
* To develop an AI-powered chatbot using external NLP APIs (e.g., OpenAI API) to provide 24/7 customer assistance for product queries, allergen checks, and order status inquiries.  
* To ensure ethical, consent-based personalization by relying exclusively on user-provided profile data rather than inferring sensitive personal attributes.  
* To evaluate system performance, recommendation accuracy, and usability through unit testing, integration testing, and basic usability assessments.

## **4\. Scope of the Project**

The scope of this project is defined by the following functional and non-functional requirements. The system is a prototype and does not aim to replace full-scale commercial retail platforms.

### **4.1 Functional Requirements**

* **FR-01: User Registration & Profile Management.** The system shall allow users to create accounts and manage personal profiles, including age range, preferred language, cultural/festival interests, and dietary preferences. All profile data shall be provided voluntarily by the user.  
* **FR-02: AI-Based Product Recommendation.** The system shall generate personalized product recommendations using a hybrid approach that combines collaborative filtering and content-based filtering, based on the user's purchase history, declared preferences, and demographic trends.  
* **FR-03: Festival-Aware Recommendation.** The system shall automatically detect upcoming festivals based on user-selected cultural interests and a regional calendar, and recommend relevant seasonal products (e.g., festival food ingredients, decorations, and gifts).  
* **FR-04: Personalized Promotions & Loyalty.** The system shall apply predefined promotional campaigns and loyalty reward points based on purchase frequency and loyalty tier. Pricing adjustments shall be transparent and explained to the user.  
* **FR-05: AI Chatbot Assistant.** The system shall provide an AI-powered chatbot, integrated via external API calls (e.g., OpenAI API), capable of answering product queries, checking ingredient/allergen information, and providing order status updates. The chatbot shall support text input.  
* **FR-06: Shopping List & Online–Offline Synchronization.** The system shall allow users to create and manage digital shopping lists via the web application, with real-time synchronization to in-store self-scanning devices and kiosks.  
* **FR-07: Order & Payment Processing (Simulated).** The system shall support a simulated checkout and payment flow, including mock payment confirmation and digital receipt generation. No real financial transactions will be processed.  
* **FR-08: Product Browsing & Search.** The system shall allow users to browse and search the product catalog by category, keyword, and festival-related tags.

### **4.2 Non-Functional Requirements**

* **NFR-01: Performance.** The system shall return personalized recommendations within 2 seconds of a user request under normal operating conditions.  
* **NFR-02: Scalability.** The system shall support at least 500 concurrent users without significant performance degradation.  
* **NFR-03: Security.** The system shall implement secure authentication using JWT tokens and encrypt all sensitive user data in transit (HTTPS) and at rest.  
* **NFR-04: Privacy & Ethical Compliance.** The system shall follow consent-based data collection practices. No sensitive personal attributes (e.g., race, ethnicity) shall be inferred from user data. All personalization shall rely on explicitly provided user inputs.  
* **NFR-05: Availability.** The system prototype shall target 99% uptime during the demonstration and testing phases.  
* **NFR-06: Usability.** The web application interface shall be intuitive and accessible, requiring no prior training for end users to perform basic tasks (browsing, adding to cart, using chatbot).  
* **NFR-07: Maintainability.** The system shall adopt a modular architecture with clear separation between frontend and backend, enabling independent development, testing, and future extension of individual modules.

## **5\. Literature Review (Brief)**

Personalized recommendation systems have been extensively studied and widely implemented in e-commerce and retail environments to enhance product discovery, customer engagement, and overall satisfaction. Research consistently demonstrates that recommendation technologies significantly improve user experience and sales performance in online and hybrid shopping platforms \[11\].

Collaborative filtering (CF) and content-based filtering (CBF) are two foundational approaches in recommendation systems. While collaborative filtering leverages user–item interaction data to identify patterns among similar users, content-based filtering utilizes product attributes to recommend items with similar characteristics \[12\]. However, standalone methods often suffer from limitations such as cold-start problems or sparse interaction data. To address these issues, hybrid recommendation systems that combine CF and CBF techniques have been shown to outperform single-method approaches in terms of accuracy and robustness \[13\].

In the context of supermarket and retail environments, recent studies emphasize the importance of integrating user behavior data with product metadata, such as categories, brands, and departments, to generate more relevant recommendations \[14\]. Product embedding techniques derived from structured product attributes have been shown to improve similarity detection, especially when identifying complementary or substitute products\[15\]. These approaches are particularly useful in smart supermarket systems where transaction data may be limited or incomplete\[16\].

Furthermore, contextual awareness has emerged as a critical component in modern recommendation systems. Factors such as seasonality, time of day, shopping intent, and user mood can significantly influence purchasing behavior \[17\]. Context-aware recommendation systems incorporate such dynamic variables to enhance personalization and adapt recommendations to situational factors, thereby improving user satisfaction and recommendation relevance.

Beyond recommendation algorithms, conversational AI has also been increasingly integrated into retail systems. API-based chatbot systems enable scalable customer interaction, allowing users to inquire about products, receive personalized suggestions, and obtain order-related assistance in real time \[18\]. Research suggests that conversational interfaces can improve user engagement and reduce customer service workload when integrated with recommendation engines.

Collectively, the literature supports the development of a hybrid, context-aware recommendation system enhanced by an API-driven conversational assistant. By integrating collaborative filtering, content-based embeddings, contextual modeling, and conversational AI capabilities, the proposed system aligns with established research trends in intelligent retail technologies.

## **6\. Proposed Methodology**

This project follows a structured Software Development Lifecycle (SDLC) approach combined with iterative Agile development to ensure systematic design and implementation.

Requirement Analysis: The project begins with requirement elicitation and specification, including functional requirements and non-functional requirements. Use case modeling and requirement documentation are produced in this phase.

System Design: A three-layer architecture is designed to ensure modularity and maintainability. UML diagrams, database schema, API contracts, and recommendation logic design are defined before implementation.

Implementation: The system is developed in iterative sprints. The frontend and backend are implemented separately and communicate via RESTful APIs. The recommendation engine integrates hybrid filtering methods, while the chatbot is implemented through external AI API calls (no local model deployment).

Testing: Testing includes unit testing, integration testing, and system testing to ensure correctness and reliability. Basic usability testing is conducted to evaluate user experience.

Deployment & Maintenance: The prototype is deployed in a containerized environment. Post-deployment improvements include performance tuning, bug fixing, and chatbot prompt optimization.

## **7\. System Architecture**

The system adopts a Three-Layer Architecture consisting of:

1. Frontend  
2. Backend & AI Integration  
3. Databases & Storage

Between layers, there exists an interface. The diagram is shown as follow:

![][image1]

## **8\. Tools & Technologies**

Programming Languages: Python, JavaScript

Frameworks: React, Node.js / FastAPI

Database: PostgreSQL (primary); MongoDB (optional for document-style data such as product metadata and chat logs)

Development Tools: Git, Docker, VS Code

LLM: OpenAI API

Hardware: Standard cloud or local development machines

## **9\. Expected Outcomes**

A functional prototype of a personalized hypermarket shopping system.

Improved product discovery through AI-based recommendations.

Seamless synchronization between online and in-store shopping lists.

An API-based AI chatbot that improves customer interaction.

A privacy-aware and ethical personalization framework.

## 

## **10\. Project Timeline**

### Phase 1: Requirement Analysis & Project Proposal (Jan 30 \- Feb 9\)

* Requirement elicitation  
* Scope definition  
* Initial architecture idea  
* Deliverable:  
  1. Project Proposal 

### Phase 2: System Design (Feb 10 – Mar 1\)

* Use cases  
* UML diagrams (use case, class, sequence)  
* High-level architecture design  
* Deliverables:  
  1. Workshop 4 (Use Case)  
  2. Workshop 5 (UML)  
  3. Project II (Design)

### Phase 3: Implementation (Mar 2 – Mar 22\)

* Frontend \+ backend development  
* Recommendation logic  
* Chatbot API integration  
* Basic online–offline sync (prototype)  
* Deliverables:  
  1. Project III (Implementation milestone)

### Phase 4: Testing (Mar 23 – Apr 5\)

* Unit testing  
* Integration testing  
* Basic usability testing  
* Deliverables:  
  1. Workshop 9 (Testing)

### Phase 5: Documentation & Submission(Apr 6 – Apr 12\)

* Final report  
* Slides & demo prep  
* Deliverables:  
  1. Final Project  
  2. Final Presentation (Week 13\)

![][image2]

## **11\. Feasibility Study**

Technical Feasibility: The project uses widely adopted web frameworks and cloud-based AI APIs, making implementation feasible.

Time Feasibility: The modular design allows completion within the academic term.

Resource Feasibility: The system requires standard development tools and does not need specialized hardware

## **12\. Conclusion**

This project proposes an AI-driven personalized shopping experience that enhances customer engagement and retail efficiency through intelligent recommendations, festival-aware suggestions, and an API-based AI chatbot. By focusing on ethical, consent-based personalization and seamless online–offline integration, the system demonstrates the practical application of modern AI and web technologies in retail.

## **13\. References APA citation style**

List research papers, books, and online resources.

**Papers:**

\[1\] Xu, K., Chen, Y., Zhang, L., Wang, H., & Liu, M. (2024). *Intelligent classification and personalized recommendation of e-commerce products based on machine learning*. **arXiv**. https://arxiv.org/abs/2403.19345

\[2\] Xia, H., Wei, X., An, W., Zhang, Z., & Sun, Z. (2021). An e-commerce recommendation system based on dynamic analysis of customer behavior. *Sustainability, 13*(19), Article 10786\. https://doi.org/10.3390/su131910786

\[3\] Duy, N. N., Nguyen, V., Trinh, T., Ho, T., & Le, H. (2024). A personalized product recommendation model in e-commerce based on retrieval strategy. *Journal of Open Innovation: Technology, Market, and Complexity, 10*(2), Article 100303\. https://doi.org/10.1016/j.joitmc.2024.100303

\[4\] Nicolescu, L., & Tudorache, M. T. (2022). Human–computer interaction in customer service: The experience with AI chatbots—A systematic literature review. *Electronics, 11*(10), Article 1579\. https://doi.org/10.3390/electronics11101579

\[5\] Thaichon, P., Quach, S., Barari, M., & Nguyen, M. (2024). Exploring the role of omnichannel retailing technologies: Future research directions. *Australasian Marketing Journal, 32*(2), 118–134. https://doi.org/10.1177/18393349231198667

\[6\] Zhang, Y. (2023). Research on user behavior analysis in e-commerce platforms based on personalized recommendation algorithms. In *Proceedings of the International Conference on Decision Science and Management* (pp. 122–127).

\[7\] Nuruzzaman, M., & Hussain, O. K. (2018). A survey on chatbot implementation in customer service industry through deep neural networks. In *Proceedings of the IEEE 15th International Conference on e-Business Engineering (ICEBE)* (pp. 54–61). IEEE. https://doi.org/10.1109/ICEBE.2018.00016

\[8\] Lazaris, C., Sarantopoulos, P., Vrechopoulos, A., & Doukidis, G. (2021). Effects of increased omnichannel integration on customer satisfaction and loyalty intentions. *International Journal of Electronic Commerce, 25*(4), 440–468. https://doi.org/10.1080/10864415.2021.1967003

\[9\] Zhang, H., Wang, J., Liu, Y., & Chen, Q. (2025). The influence of artificial intelligence chatbot problem solving on customers’ continued usage intention in e-commerce platforms: An expectation-confirmation model approach. *Journal of Business Research, 180*, Article 114725\. https://doi.org/10.1016/j.jbusres.2024.114725

\[10\] Rahman, S. M., Carlson, J., Gudergan, S. P., Wetzels, M., & Grewal, D. (2025). How do omnichannel customer experiences affect customer engagement? Theory and empirical validation. *Journal of Business Research, 189*, Article 115238\. https://doi.org/10.1016/j.jbusres.2024.115238

\[11\] Necula, S.-C., & Păvăloaia, V.-D. (2023). AI-driven recommendations: A systematic review of the state of the art in e-commerce. *Applied Sciences, 13*(9), Article 5531\. https://doi.org/10.3390/app13095531

\[12\] Bodduluri, K. C., Palma, F., Kurti, A., Jusufi, I., & Löwenadler, H. (2024). Exploring the landscape of hybrid recommendation systems in e-commerce: A systematic literature review. *IEEE Access, 12*, 28273–28296. https://doi.org/10.1109/ACCESS.2024.3365828

\[13\] Widayanti, R. (2023). Improving recommender systems using hybrid techniques of collaborative filtering and content-based filtering. *Journal of Applied Data Sciences, 4*(3), 289–302. https://doi.org/10.47738/jads.v4i3.115

\[14\] Lawrence, R., Almasi, G., Kotlyar, V., et al. (2001). Personalization of supermarket product recommendations. *Data Mining and Knowledge Discovery, 5*, 11–32. https://doi.org/10.1023/A:1009835726774

\[15\] Zhang, M., Wei, X., Guo, X., Chen, G., & Wei, Q. (2019). Identifying complements and substitutes of products: A neural network framework based on product embedding. *ACM Transactions on Knowledge Discovery from Data, 13*(3), Article 29\. https://doi.org/10.1145/3320277

\[16\] Dhanushkodi, K., Bala, A., Kodipyaka, N., & Shreyas, V. (2025). Customer behavior analysis and predictive modeling in supermarket retail: A comprehensive data mining approach. *IEEE Access, 13*, 2945–2957. https://doi.org/10.1109/ACCESS.2024.3407151

\[17\] Adomavicius, G., Bauman, K., Tuzhilin, A., & Unger, M. (2022). Context-aware recommender systems: From foundations to recent developments. In F. Ricci, L. Rokach, & B. Shapira (Eds.), *Recommender systems handbook* (3rd ed., Chap. 6). Springer. https://doi.org/10.1007/978-1-0716-2197-4\_6

\[18\] Reddy, N. T. K., Patra, M. R., & Mishra, B. K. (2025). AI-based chatbot with recommender system for interactive support. In S. K. Udgata, D. Mohapatra, S. Sethi, & M. E. Rana (Eds.), *Intelligent systems* (Lecture Notes in Networks and Systems, Vol. 1624). Springer.

**Books:**

\[19\] Xu, A. (2020). *System design interview: An insider’s guide* (Vol. 1). ByteByteGo.

**Online Resources:**

\[20\] PostgreSQL Global Development Group. (n.d.). *PostgreSQL official documentation*. https://www.postgresql.org/docs/

\[21\] MongoDB, Inc. (n.d.). *MongoDB official documentation*. https://www.mongodb.com/docs/

\[22\] OpenAI. (n.d.). *OpenAI API documentation*. https://platform.openai.com/docs/

[image1]: diagram/Architecture.png

[image2]: diagram/timeline.png