from secrets import token_urlsafe

from sqlalchemy.orm import Session

from app.models import Answer, Choice, Form, FormStatus, Question, QuestionKind, Submission


def seed_if_empty(db: Session) -> None:
    if db.query(Form).first():
        return

    feedback = Form(
        title="Product pulse check",
        description="Quick research form used by the growth team.",
        status=FormStatus.published,
        public_slug="product-pulse",
        welcome_title="Got a minute?",
        welcome_message="We'd love to hear how this product is working for you. This should take about 2 minutes.",
        thank_you_title="You made our day",
        thank_you_message="Thanks for the honest feedback — we'll read every answer.",
        accent_color="#0445AF",
    )
    db.add(feedback)
    db.flush()

    q1 = Question(
        form_id=feedback.id,
        kind=QuestionKind.short_text,
        prompt="What's your first name?",
        help_text="Just so we can say thanks properly.",
        required=True,
        position=0,
        placeholder="Type your answer here...",
    )
    q2 = Question(
        form_id=feedback.id,
        kind=QuestionKind.email,
        prompt="And your email?",
        required=True,
        position=1,
        placeholder="name@example.com",
    )
    q3 = Question(
        form_id=feedback.id,
        kind=QuestionKind.rating,
        prompt="How would you rate the product overall?",
        help_text="1 is awful, 5 is outstanding.",
        required=True,
        position=2,
        rating_max=5,
    )
    q4 = Question(
        form_id=feedback.id,
        kind=QuestionKind.multiple_choice,
        prompt="What do you use it for most?",
        required=True,
        position=3,
    )
    q5 = Question(
        form_id=feedback.id,
        kind=QuestionKind.yes_no,
        prompt="Would you recommend it to a colleague?",
        required=True,
        position=4,
    )
    q6 = Question(
        form_id=feedback.id,
        kind=QuestionKind.long_text,
        prompt="Anything else we should improve?",
        required=False,
        position=5,
        placeholder="Type your answer here...",
    )
    db.add_all([q1, q2, q3, q4, q5, q6])
    db.flush()
    research = Choice(question_id=q4.id, label="Customer research", position=0)
    onboarding = Choice(question_id=q4.id, label="Onboarding surveys", position=1)
    db.add_all(
        [
            research,
            onboarding,
            Choice(question_id=q4.id, label="Event RSVPs", position=2),
            Choice(question_id=q4.id, label="Internal feedback", position=3),
        ]
    )
    db.flush()

    samples = [
        ("Priya", "priya@studio.co", 5, research.id, True, "The one-question flow feels so much less exhausting."),
        ("Marcus", "marcus@north.io", 4, onboarding.id, True, "I'd love a dark theme for late-night filling."),
        ("Elena", "elena@harbor.app", 3, research.id, False, "A few of the questions felt repetitive."),
        ("Jonah", "jonah@leaf.co", 5, onboarding.id, True, None),
    ]
    for name, email, rating, choice_id, recommend, note in samples:
        submission = Submission(form_id=feedback.id)
        db.add(submission)
        db.flush()
        db.add_all(
            [
                Answer(submission_id=submission.id, question_id=q1.id, text_value=name),
                Answer(submission_id=submission.id, question_id=q2.id, text_value=email),
                Answer(submission_id=submission.id, question_id=q3.id, number_value=rating),
                Answer(submission_id=submission.id, question_id=q4.id, choice_id=choice_id),
                Answer(submission_id=submission.id, question_id=q5.id, bool_value=recommend),
            ]
        )
        if note:
            db.add(Answer(submission_id=submission.id, question_id=q6.id, text_value=note))

    hiring = Form(
        title="Studio internship application",
        description="Hiring form for the summer internship cohort.",
        status=FormStatus.published,
        public_slug="internship-26",
        welcome_title="Apply to the studio",
        welcome_message="We're looking for curious builders. Take your time — there are no trick questions.",
        thank_you_title="Application received",
        thank_you_message="We'll be in touch within two weeks if there's a match.",
        accent_color="#191919",
    )
    db.add(hiring)
    db.flush()
    h1 = Question(form_id=hiring.id, kind=QuestionKind.short_text, prompt="Full name", required=True, position=0, placeholder="Ada Lovelace")
    h2 = Question(form_id=hiring.id, kind=QuestionKind.email, prompt="Email address", required=True, position=1)
    h3 = Question(form_id=hiring.id, kind=QuestionKind.dropdown, prompt="Which team are you most excited about?", required=True, position=2)
    h4 = Question(
        form_id=hiring.id,
        kind=QuestionKind.number,
        prompt="Years of coding experience",
        required=True,
        position=3,
        number_min=0,
        number_max=20,
    )
    h5 = Question(form_id=hiring.id, kind=QuestionKind.long_text, prompt="Tell us about a project you're proud of", required=True, position=4)
    db.add_all([h1, h2, h3, h4, h5])
    db.flush()
    design = Choice(question_id=h3.id, label="Product design", position=0)
    eng = Choice(question_id=h3.id, label="Engineering", position=1)
    db.add_all(
        [
            design,
            eng,
            Choice(question_id=h3.id, label="Research", position=2),
            Choice(question_id=h3.id, label="Brand", position=3),
        ]
    )
    db.flush()
    app = Submission(form_id=hiring.id)
    db.add(app)
    db.flush()
    db.add_all(
        [
            Answer(submission_id=app.id, question_id=h1.id, text_value="Sam Okonkwo"),
            Answer(submission_id=app.id, question_id=h2.id, text_value="sam@okonkwo.dev"),
            Answer(submission_id=app.id, question_id=h3.id, choice_id=eng.id),
            Answer(submission_id=app.id, question_id=h4.id, number_value=3),
            Answer(submission_id=app.id, question_id=h5.id, text_value="I built a neighborhood tool library with a waitlist and SMS reminders."),
        ]
    )
    app2 = Submission(form_id=hiring.id)
    db.add(app2)
    db.flush()
    db.add_all(
        [
            Answer(submission_id=app2.id, question_id=h1.id, text_value="Riley Chen"),
            Answer(submission_id=app2.id, question_id=h2.id, text_value="riley@chen.design"),
            Answer(submission_id=app2.id, question_id=h3.id, choice_id=design.id),
            Answer(submission_id=app2.id, question_id=h4.id, number_value=1),
            Answer(submission_id=app2.id, question_id=h5.id, text_value="A museum audio guide redesigned as a conversational walk."),
        ]
    )

    draft = Form(
        title="Event RSVP (draft)",
        description="Not published yet.",
        status=FormStatus.draft,
        public_slug=token_urlsafe(6)[:10],
        welcome_title="You're invited",
        welcome_message="Tell us if you can make Friday's salon.",
        accent_color="#0445AF",
    )
    db.add(draft)
    db.flush()
    db.add(
        Question(
            form_id=draft.id,
            kind=QuestionKind.yes_no,
            prompt="Will you be there on Friday?",
            required=True,
            position=0,
        )
    )
    db.commit()
