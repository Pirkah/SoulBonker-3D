#include "ProfessorBoss.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Kismet/GameplayStatics.h"

AProfessorBoss::AProfessorBoss()
{
	PrimaryActorTick.bCanEverTick = true;
	CurrentHealth = MaxHealth;

	GetCharacterMovement()->MaxWalkSpeed = 420.0f;
}

void AProfessorBoss::BeginPlay()
{
	Super::BeginPlay();
}

void AProfessorBoss::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

void AProfessorBoss::AttackSilenceDansLAmphi()
{
	// Seismic Ground Slam Shockwave
	FVector Origin = GetActorLocation();
	TArray<AActor*> IgnoredActors;
	IgnoredActors.Add(this);

	UGameplayStatics::ApplyRadialDamage(
		this,
		BaseDamage * 1.5f,
		Origin,
		750.0f,
		UDamageType::StaticClass(),
		IgnoredActors,
		this,
		GetController(),
		true
	);
}

void AProfessorBoss::AttackDistributionCopies()
{
	// Hurl Exam Papers 0/20
}

void AProfessorBoss::TriggerEnragePhase()
{
	bIsEnraged = true;
	GetCharacterMovement()->MaxWalkSpeed = 620.0f;
	BaseDamage *= 1.4f;
}

void AProfessorBoss::TakeBonkDamage(float DamageAmount, FVector HitDirection, float KnockbackForce)
{
	CurrentHealth -= DamageAmount;

	// Megabonk Impulse
	LaunchCharacter(HitDirection * KnockbackForce, true, true);

	if (CurrentHealth <= MaxHealth * 0.5f && !bIsEnraged)
	{
		TriggerEnragePhase();
	}

	if (CurrentHealth <= 0.0f)
	{
		CurrentHealth = 0.0f;
		GetCharacterMovement()->DisableMovement();
		SetLifeSpan(3.0f);
	}
}
